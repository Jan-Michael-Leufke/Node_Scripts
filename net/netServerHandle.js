const net = require("node:net");

const ac = new AbortController();

signal = ac.signal;

console.log(Object.getPrototypeOf(signal));

const server1 = net.createServer();

server1.listen(
  { port: 8124, host: "172.20.174.170", reusePort: true, abort: signal },
  () => {
    console.log("server bound at : ");
    console.log(server1.address());
  }
);
