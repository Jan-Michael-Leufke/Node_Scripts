const MiniExpress = require("./miniExpress.js");
const querystring = require("node:querystring");
const { users, posts } = require("./fakeDb.js");
const { log } = require("console");
const { createBase36Id } = require("./idCreator.js");
const { authorize, parseJson } = require("./middleware.js");
const { sessions } = require("./helpers");

const mini = new MiniExpress();

mini
  .use(authorize)
  .use(parseJson)
  .get("/", (req, res) => {
    res.sendFile("./http/statics/index.html");
  })
  .post("/upload", (req, res) => {
    res.handleUpload(req);
  })
  .post("/login", (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const { username, password } = querystring.parse(body);
      if (!username || !password) {
        return res.status(400).json({ error: "Invalid login credentials" });
      }

      const user = users.find(
        (user) => user.username === username && user.password === password
      );
      if (!user) {
        return res.status(401).json({ error: "Invalid login credentials" });
      }

      const sessionId = createBase36Id();

      sessions[sessionId] = {
        sessionId,
        userId: user.id,
        name: user.name,
        username: user.username,
        created: Date.now(),
      };

      res.setHeader("Set-Cookie", [
        `sessionId=${sessionId}; HttpOnly; Path=/; Expires=${new Date(
          Date.now() + 60000
        ).toUTCString()}; Max-Age=3600`,
        "test=testcookie; Path=/; Expires=" +
          new Date(Date.now() + 60000).toUTCString() +
          "; Max-Age=3600",
      ]);
      res.json({ message: "Login successful" });
    });
  })
  .get("/api/auth/status", (req, res) => {
    const isLoggedIn = !!req.session;

    return res.json({
      isLoggedIn,
      ...(isLoggedIn
        ? {
            user: req.session,
          }
        : {}),
    });
  })
  .get("/logout", (req, res) => {
    if (req.session && req.session.sessionId) {
      delete sessions[req.session.sessionId];
    }
    req.session = null;

    res.setHeader("Set-Cookie", [
      `sessionId=; HttpOnly; Path=/; Expires=${new Date(
        0
      ).toUTCString()}; Max-Age=0`,
    ]);

    res.writeHead(302, { Location: "/login" });
    res.end();
  })
  .get("/api/posts", (req, res) => {
    const updatedPosts = posts.map((post) => ({
      ...post,
      author: users.find((user) => user.id === post.userId)?.name || "Unknown",
    }));

    res.json(updatedPosts);
  })
  .post("/api/posts", (req, res) => {
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: "Invalid post data" });
    }

    const newPost = {
      id: createBase36Id(),
      title: req.body.title,
      content: req.body.content,
      userId: req.session.userId,
      author: req.session.name,
    };

    posts.push(newPost);
    res.status(201).json(newPost);
  })
  .listen(9001);
