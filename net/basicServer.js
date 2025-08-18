const net = require("node:net");
const stream = require("node:stream");
const blocklist = new net.BlockList();

const server = net.createServer(
  {
    allowHalfOpen: true,
    highWaterMark: 5000,
    noDelay: true,
    blockList: blocklist,
    pauseOnConnect: true,
  },
  (socket) => {
    socket.setKeepAlive(true, 10000);
    console.log("client connected (from server)");
    socket
      .on("end", () => {
        console.log("client disconnected (from server)");
        console.log("calling end at the server (from server)");

        setTimeout(() => {
          socket.end("last message from server via end func");
        }, 3000);
      })
      .on("data", (data) => {
        console.log(`Received: ${data} (from server)`);
      })
      .on("close", () => {
        console.log("socket closed (from server)");
      })
      .on("error", (err) => {
        console.error(`socket error: ${err} (from server)`);
      });

    socket.write("server writes hello\r\n");
    //   socket.pipe(socket);

    setTimeout(() => {
      socket.resume();
    }, 7000);
  }
);
server.on("error", (err) => {
  throw err;
});

server.listen(8124, "172.20.174.170", () => {
  console.log("server bound at : ");
  console.log(server.address());
});
