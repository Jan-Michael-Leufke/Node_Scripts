const http = require("http");
const net = require("node:net");
const { log, dir } = require("node:console");

const httpserver = http
  .createServer((req, res) => {
    const url = new URL(`http://${req.headers.host}${req.url}`);
    log(url);
    log(`HTTP request received: ${req.method} ${req.url}`);
    log("request headers:", req.headers);

    req.on("data", (chunk) => {
      log("request body chunk: ", chunk.toString("utf8"));
    });

    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello, HTTP client, got your request!");
    }, 1000);
  })
  .listen(8080, "localhost", () => {
    log("HTTP server listening on http://localhost:8080");
  });

httpserver.keepAliveTimeout = 5000;
