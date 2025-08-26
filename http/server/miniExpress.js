const http = require("node:http");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const extToMime = require("./extToMime.js");

module.exports = class MiniExpress {
  #routes;
  #server;
  #serverOptions;
  #miniOptions;

  constructor(serverOptions, miniOptions) {
    this.#serverOptions = serverOptions || {
      keepAliveTimeout: 6000,
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

    this.#miniOptions = miniOptions || {
      showRoutes: true,
    };

    this.#routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
      PATCH: {},
    };

    this.ready = this.#registerStaticRoutes(this.#miniOptions.showRoutes);

    this.#server = http.createServer(this.#serverOptions, (req, res) => {
      this.#handleRequest(req, res);
    });

    this.#server.on("connection", (socket) => {
      socket
        .on("timeout", () => {
          console.log("Socket timed out");
        })
        .on("close", (hadError) => {
          console.log("Socket closed", hadError ? "with error" : "");
        });
    });
  }

  get(path, handler) {
    this.#routes.GET[path] = handler;
    return this;
  }

  post(path, handler) {
    this.#routes.POST[path] = handler;
    return this;
  }

  put(path, handler) {
    this.#routes.PUT[path] = handler;
    return this;
  }

  delete(path, handler) {
    this.#routes.DELETE[path] = handler;
    return this;
  }

  patch(path, handler) {
    this.#routes.PATCH[path] = handler;
    return this;
  }

  listen(port, host = "localhost", backlog = 511, callback) {
    this.ready
      .then(() => {
        return new Promise((resolve) => {
          this.#server.listen(port, host, backlog, () => {
            if (callback) callback();
            resolve();
          });
        });
      })
      .then(() => {
        console.log(
          `Server listening on http://${host}:${this.#server.address().port}`
        );
      });
  }

  #handleRequest(req, res) {
    const { method, url } = req;
    const handler = this.#routes[method][url];

    if (handler) {
      this.#patchServerResponse(res);
      handler(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  }

  #registerStaticRoutes(showRoutes = true) {
    return fsPromises
      .readdir("./http/statics")
      .then(async (files) => {
        for (const file of files) {
          const filePath = `./http/statics/${file}`;

          const fileStats = await fsPromises.stat(filePath);
          if (fileStats.isDirectory()) continue;

          const extention = file.split(".").pop();

          const contentType =
            extToMime["." + extention] || "application/octet-stream";

          this.get(`/${file}`, (req, res) => {
            res.writeHead(200, { "Content-Type": contentType });
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
        if (!showRoutes) return;
        for (const method in this.#routes) {
          const len = Object.keys(this.#routes[method]).length;
          if (len === 0) continue;
          console.log(len, method, "route(s):");
          console.log(Object.keys(this.#routes[method]));
        }
      });
  }

  #patchServerResponse(res) {
    Object.entries(serverResExtentions).forEach(([name, fn]) => {
      res[name] = fn;
    });
  }
};

const serverResExtentions = {
  json(data) {
    this.writeHead(200, { "Content-Type": "application/json" });
    this.end(JSON.stringify(data));
  },
  sendFile(filePath, contentType = "text/plain") {
    const rs = fs.createReadStream(filePath).on("error", () => {
      this.writeHead(404, { "Content-Type": "text/plain" });
      this.end("File Not Found");
    });

    const extention = filePath.split(".").pop();
    const mimeType = extToMime["." + extention] || contentType;

    this.writeHead(200, { "Content-Type": mimeType });
    rs.pipe(this);
  },
};
