const net = require("node:net");

const port = 8080;
const host = "172.20.174.170";
let receivedChunks = 0;

const server = new net.Server((socket) => {
  console.log("TCP connection established");
  console.log("local address:", socket.localAddress);
  console.log("remote address:", socket.remoteAddress);
  console.log("remote port:", socket.remotePort);
  console.log("bytes read:", socket.bytesRead);

  socket.on("data", (data) => {
    console.log("Received TCP data:", data.toString());
    socket.write(`Server response - Received chunk ${++receivedChunks}. `);
    console.log("bytes read:", socket.bytesRead);
  });
  socket.on("end", () => {
    console.log("TCP connection ended");
  });
});

server.listen({ host, port }, () => {
  console.log(`TCP server listening on ${host}:${port}`);
});
