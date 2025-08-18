const net = require("node:net");

const port = 8080;
const host = "172.20.174.170";

const client = new net.Socket({
  readable: true,
  writable: true,
  allowHalfOpen: false,
})
  .connect({ port, host, autoSelectFamily: true }, () => {
    console.log(`Connected to TCP server at ${host}:${port}`);
    console.log("local address:", client.localAddress);
  })
  .setEncoding("utf8")
  .on("data", (data) => {
    console.log("Received TCP data:", data.toString());
  })
  .on("end", () => {
    console.log("client tcp socket ended, Disconnected from TCP server");
  })
  .on("close", (hadError) => {
    if (hadError) {
      console.error("client Connection closed due to an transmission error...");
    } else {
      console.log("client Connection closed gracefully");
    }
    console.log("total bytes written:", client.bytesWritten);
    console.log("total bytes read:", client.bytesRead);
  })
  .on("error", (err) => {
    console.error("TCP client error:", err);
    console.log("close event will be fired soon...");
  })
  .on("connectionAttempt", (ip, port, family) => {
    console.log(
      `Attempting to connect to TCP server at ${ip}:${port} family: ip_v(${family})...`
    );
  })
  .on("lookup", (err, address, family, host) => {
    if (err) {
      console.error("DNS lookup error:", err);
    } else {
      console.log("DNS lookup successful:", address, host, family);
    }
  })
  .on("ready", () => {
    console.log("TCP client is ready");
    postConnectHandler();
  });

function postConnectHandler() {
  console.log("postConnectHandler runs");

  console.log("local address:", client.localAddress);
  console.log("remote address:", client.remoteAddress);
  console.log("local port:", client.localPort);
  console.log("remote port:", client.remotePort);

  const nums = Array.from({ length: 100 }, (_, i) => ` ${i % 256} `);

  const buf = Buffer.concat(nums.map((num) => Buffer.from(num, "utf8")));

  client.write(buf);
  // client.end("last message from client");
}

function byteToStringToBuffer(nums) {
  return nums.reduce((acc, num) => {
    return Buffer.concat([acc, Buffer.from(num.toString(), "utf8")]);
  }, Buffer.alloc(0));
}
