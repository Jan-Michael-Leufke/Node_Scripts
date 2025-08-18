const net = require("node:net");
const { DefaultDeserializer } = require("node:v8");

const server = net
  .createServer((socket) => {
    console.log("client connected (server)");

    socket
      .on("data", (data) => {
        console.log(data);
        console.log(`Received: ${data.toString("utf16le")} (server)`);
      })
      .on("end", () => {
        console.log("client disconnected (server)");
        socket.end("goodbye from server");
      });
    socket.write("server writes hello\r\n");
  })
  .listen({ port: 8124, host: "0.0.0.0", backlog: 100 }, () => {
    console.log("server listening on: ", server.address());
  });
