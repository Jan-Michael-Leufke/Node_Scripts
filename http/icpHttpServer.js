const { log, dir, error } = require("node:console");
const fs = require("node:fs");
const http = require("node:http");

const SOCKET_PATH = "/tmp/sockets/http.sock";

try {
  fs.unlinkSync(SOCKET_PATH);
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

http
  .createServer((req, res) => {
    log(`request received: ${req.method} ${req.url}`);
    req
      .on("data", (chunk) => {
        log(`request body: ${chunk.toString("utf8")}`);
      })
      .on("end", () => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("data received, Hello back from icp http server!\n");
      });
  })
  .listen(SOCKET_PATH, () => {
    console.log(`http Server listening on ${SOCKET_PATH}`);
  });
