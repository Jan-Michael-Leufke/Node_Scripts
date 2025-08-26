const http = require("node:http");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

module.exports = class MiniExpress {
  constructor(serverOptions) {
    this.serverOptions = serverOptions || {
      keepAliveTimeout: 5000,
      connectionsCheckTimeout: 10000,
      highWaterMark: 64,
      joinDuplicateHeaders: false,
      keepAlive: true,
      keepAliveInitialDelay: 20000,
      maxHeaderSize: 8192,
      noDelay: true,
      requestTimeout: 60000,
      requireHostHeader: true,
      uniqueHeaders: ["host", "content-length", "authorization"],
      rejectNonStandardBodyWrites: false,
    };

    this.routes = {
      GET: {},
      POST: {},
    };

    this.#registerStaticRoutes();
  }
  #server = http.createServer(this.serverOptions, (req, res) =>
    this.handleRequest(req, res)
  );

  get(path, handler) {
    this.routes.GET[path] = handler;
    return this;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
    return this;
  }

  handleRequest(req, res) {
    const { method, url } = req;
    const handler = this.routes[method][url];

    if (handler) {
      handler(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  }

  listen(
    port = 9001,
    host = "localhost",
    backlog = 511,
    callback = () => {
      console.log(`Server is listening on http://${host}:${port}`);
    }
  ) {
    this.#server.listen(port, host, backlog, callback);
  }

  #registerStaticRoutes() {
    fsPromises
      .readdir("./http/statics")
      .then(async (files) => {
        for (const file of files) {
          const filePath = `./http/statics/${file}`;

          const fileStats = await fsPromises.stat(filePath);
          if (fileStats.isDirectory()) continue;

          const extention = file.split(".").pop();

          const fileType =
            extention === "js"
              ? "text/javascript"
              : extention === "css"
              ? "text/css"
              : extention === "html"
              ? "text/html"
              : "application/octet-stream";

          this.get(`/${file}`, (req, res) => {
            res.writeHead(200, { "Content-Type": fileType });
            fs.createReadStream(filePath).pipe(res);
          });

          if (extention === "html") {
            const baseName = file.replace(/\.html$/, "");
            this.get(`/${baseName}`, (req, res) => {
              res.writeHead(200, { "Content-Type": "text/html" });
              fs.createReadStream(filePath).pipe(res);
            });
          }
        }
      })
      .finally(() => {
        for (const method in this.routes) {
          const len = Object.keys(this.routes[method]).length;
          if (len === 0) continue;
          console.log(len, method, "route(s):");
          console.log(Object.keys(this.routes[method]));
        }
      });
  }
};
