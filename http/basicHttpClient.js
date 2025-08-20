const http = require("http");
const net = require("node:net");
const { log, dir } = require("node:console");

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 10,
  keepAliveMsecs: 3000,
  maxTotalSockets: 256,
  maxFreeSockets: 5,
  scheduling: "fifo",
  timeout: 30000,
}).on("free", (socket, options) => {
  log("Socket is free", socket.Identifier);
});

const requestOptions = {
  agent,
  hostname: "localhost",
  port: 8080,
  method: "POST",
  path: "/",
  headers: {
    "Content-Type": "text/plain",
  },
};

let socketIdentifier = 0;

function sendRequest(options, message) {
  let thisSocket = null;
  const request = http
    .request(options, (res) => {
      log(`HTTP response received: ${res.statusCode} ${res.statusMessage}`);
      log("response header: ", res.headers);
      let body = "";
      res
        .on("data", (chunk) => {
          log("data handler runs");
          body += chunk.toString("utf8");
        })
        .on("end", () => {
          log(
            `Response body (complete): ${body} from socket ${
              thisSocket && thisSocket.Identifier
            }`
          );
        });
    })
    .once("socket", (socket) => {
      thisSocket = socket;
      if (!socket.Identifier) {
        socket.Identifier = ++socketIdentifier;
      }
      log(`Socket connected: ${socket.Identifier}`);
    })
    .on("error", (err) => {
      console.error(`Request error: ${err.message}`);
    });

  request.write(message);

  setTimeout(() => {
    request.end();
  }, 1000);
}

sendRequest(requestOptions, "Hello, server!");
setTimeout(() => {
  sendRequest(requestOptions, "Hello again, server!");
}, 1000);
