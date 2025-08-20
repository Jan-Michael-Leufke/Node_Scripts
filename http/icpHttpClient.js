const http = require("http");
const IcpAgent = require("./icpHttpAgent.js");
const { log, dir } = require("node:console");

const agent = new IcpAgent({
  keepAlive: true,
  maxSockets: 10,
  keepAliveMsecs: 3000,
  maxTotalSockets: 256,
  maxFreeSockets: 5,
  scheduling: "fifo",
  timeout: 30000,
});

const options = {
  agent,
  socketPath: "/tmp/sockets/http.sock",
  method: "POST",
  path: "/testpath",
  headers: {
    "Content-Type": "text/plain",
  },
};

sendHttpReqOverIcpSocket();

function sendHttpReqOverIcpSocket() {
  const request = http
    .request(options, (res) => {
      log(`STATUS: ${res.statusCode}`);
      log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.pipe(process.stdout);
    })
    .on("error", (err) => {
      log(`ERROR: ${err.message}`);
    });

  request.end("hello icp server");
}
