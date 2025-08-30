const { getSession } = require("./helpers.js");

function authorize(req, res, next) {
  const routesRequiringAuth = [
    "GET /logout",
    "POST /api/posts",
    "POST /upload",
  ];

  const isAuthRoute = routesRequiringAuth.includes(`${req.method} ${req.url}`);

  const session = getSession(req);

  if (isAuthRoute && !session)
    return res.status(401).json({ error: "Unauthorized" });

  if (session) {
    req.session = session;
    res.setHeader("X-User-Id", req.session.userId);
  }

  next();
}

function parseJson(req, res, next) {
  if (req.headers["content-type"] === "application/json") {
    let body = "";
    const maxBodysize = 1024 * 1024;
    let receivedBytes = 0;
    req.on("data", (chunk) => {
      body += chunk;
      receivedBytes += chunk.length;
      if (receivedBytes > maxBodysize) {
        req.destroy();
        return res.status(413).json({ error: "Payload too large" });
      }
    });

    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON" });
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  authorize,
  parseJson,
};
