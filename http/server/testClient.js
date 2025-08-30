const http = require("node:http");
const { log } = require("node:console");

http
  .request(
    {
      hostname: "localhost",
      port: 9001,
      method: "get",
      path: "/",
    },
    (res) => {
      log(`Received response with status code: ${res.statusCode}`);
      log("headers: ");
      log(res.headers);

      res.on("data", (chunk) => {
        log(`Received chunk: ${chunk}`);
      });
    }
  )
  .end();
