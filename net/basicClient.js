const net = require("node:net");

const client = net
  .createConnection({ host: "172.20.174.170", port: 8124 }, () => {
    setTimeout(() => {
      console.log("client connected (from client)");
      runPostConnection();
    }, 1000);
  })
  .on("data", (data) => {
    console.log(`Received: ${data} (from client)`);
  })
  .on("end", () => {
    console.log("end event, client disconnected (from client)");
  })
  .on("close", () => {
    console.log("client closed (from client)");
  })
  .on("error", (err) => {
    console.error(`client error: ${err} (from client)`);
  });

runPostConnection = async () => {
  console.log("after");

  Array.from({ length: 20 }).forEach((_, i) => {
    // client.write(`message ${i + 1} from client\r\n`);
    const buf = Buffer.from(`${i + 1}`, "utf8");
    client.write(buf);
  });

  setTimeout(() => {
    console.log("Calling end at the client (from client)");
    client.end("last message from client via end func");
  }, 3000);
};

async function connAwaiter() {
  new Promise((resolve) => {
    if (client.readyState === "open") {
      setTimeout(() => {
        resolve();
      }, 1000);
    } else {
      client.once("connect", () =>
        setTimeout(() => {
          resolve();
        }, 1000)
      );
    }
  });
}
