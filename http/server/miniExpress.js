const http = require("node:http");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const extToMime = require("./extToMime.js");
const { createBase36Id } = require("./idCreator.js");
const { log } = require("node:console");

// let serverOpts;
// let miniOpts;

module.exports = class MiniExpress {
  #routes;
  #server;
  #middleware;
  #serverOpts;
  #miniOpts;

  constructor(serverOptions, miniOptions) {
    this.#serverOpts = serverOptions || {
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

    this.#miniOpts = {
      showRoutes: true,
      staticsDir: "./http/statics",
      mediaDir: "./http/statics/media",
      uploadDir: "./http/statics/media/uploads",
      ...miniOptions,
    };

    this.#middleware = [];

    this.#routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
      PATCH: {},
    };

    this.ready = this.#registerStaticRoutes(this.#miniOpts.showRoutes);

    this.#server = http.createServer(this.#serverOpts, (req, res) => {
      this.#patchServerResponse(res);
      this.#runMiddleware(req, res, this.#middleware, 0);
    });

    this.#server.on("connection", (socket) => {
      socket
        .on("timeout", () => {
          // console.log("Socket timed out");
        })
        .on("close", (hadError) => {
          // console.log("Socket closed", hadError ? "with error" : "");
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

  use(handler) {
    this.#middleware.push(handler);
    return this;
  }

  routeExists(method, path) {
    return !!this.#routes[method][path];
  }

  #runMiddleware(req, res, middleware, index) {
    if (index === middleware.length) {
      this.#handleRequest(req, res);
    } else {
      middleware[index](req, res, () => {
        this.#runMiddleware(req, res, middleware, index + 1);
      });
    }
  }

  #handleRequest(req, res) {
    const { method, url } = req;
    const handler = this.#routes[method][url];

    if (handler) {
      this.#patchServerResponse(res);
      handler(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`error: ${method} ${url} not found`);
  }

  #registerStaticRoutes(showRoutes = true) {
    return fsPromises
      .readdir("./http/statics")
      .then(async (files) => {
        for (const file of files) {
          const filePath = `${this.#miniOpts.staticsDir}/${file}`;

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
    Object.entries(serverResponseExtentions(this.#miniOpts)).forEach(
      ([name, fn]) => {
        res[name] = fn;
      }
    );
  }
};

function serverResponseExtentions(miniOpts) {
  return {
    json(data) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data));
    },

    buffer(data, encoding = "utf-8") {
      let buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === "string") {
        buffer = Buffer.from(data, encoding);
      } else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (Array.isArray(data)) {
        buffer = data.every((value) => typeof value === "number")
          ? Buffer.from(data)
          : Buffer.from(JSON.stringify(data));
      } else if (typeof data === "object" && data !== null) {
        buffer = Buffer.from(JSON.stringify(data), encoding);
      } else {
        throw new TypeError("Unsupported data type");
      }

      this.setHeader("content-type", "application/octet-stream");
      this.setHeader("content-length", buffer.length);
      this.write(buffer);
      this.end();
    },

    sendFile(filePath, contentType = "application/octet-stream") {
      const extention = filePath.split(".").pop();
      const mimeType = extToMime["." + extention] || "application/octet-stream";

      const rs = fs.createReadStream(filePath);

      rs.on("open", () => {
        this.setHeader("Content-Type", mimeType);
        this.status(200);
        rs.pipe(this);
      });

      rs.on("error", () => {
        this.setHeader("Content-Type", "text/plain");
        this.status(404);
        this.end("File Not Found");
      });
    },

    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },

    handleUpload(req, customFilename) {
      const { ["x-filename"]: headerFilename, "content-type": contentType } =
        req.headers;

      const filename =
        customFilename ||
        headerFilename ||
        `unknown_${createBase36Id()}_${Date.now()}_${Date.now()}.file`;

      log("uploading:", filename, contentType);

      const writeStream = fs.createWriteStream(
        `${miniOpts.uploadDir}/${filename}`
      );

      this.setHeader("Content-Type", "application/json");

      req
        .on("data", (chunk) => {
          writeStream.write(chunk);
        })
        .on("end", () => {
          log("Upload complete");
          this.status(200);
          writeStream.end();
          this.json("File uploaded successfully!");
        })
        .on("error", (err) => {
          log("Error occurred during file upload:", err);
          this.status(500);
          this.json("Internal Server Error");
        });
    },
  };
}
