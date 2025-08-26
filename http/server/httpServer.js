const { log } = require("console");
const MiniExpress = require("./miniExpress.js");
const fs = require("node:fs");

const mini = new MiniExpress();

mini
  .get("/", (req, res) => {
    res.sendFile("./http/statics/index.html");
  })
  .post("/upload", (req, res) => {
    const { filename = "unknown.file", "content-type": contentType } =
      req.headers;
    log(filename, contentType);
    const writeStream = fs.createWriteStream(
      `http/statics/media/uploads/${filename}`
    );

    res.setHeader("Content-Type", "application/json");

    req
      .on("data", (chunk) => {
        writeStream.write(chunk);
      })
      .on("end", () => {
        log("Upload complete");
        res.statusCode = 200;
        res.json("File uploaded successfully!");
      })
      .on("error", (err) => {
        log("Error occurred during file upload:", err);
        res.statusCode = 500;
        res.json("Internal Server Error");
      });
  })
  .listen(9001);
