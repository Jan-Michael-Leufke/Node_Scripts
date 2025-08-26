const http = require("http");
const { log } = require("console");
const fs = require("fs");
const stream = require("stream");
const MiniExpress = require("./miniExpress.js");

const mini = new MiniExpress();

mini
  .get("/", (req, res) => {
    res.end("Hello from MiniExpress!");
  })
  .listen(9001, "localhost", 511, () => {
    console.log("Mini Express listening on http://localhost:9001");
  });
