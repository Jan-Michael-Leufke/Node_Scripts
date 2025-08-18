const net = require("net");
const readline = require("node:readline/promises");

const client_1 = net
  .createConnection({ port: 8124 }, () => {
    console.log("client_1 connected (client)");
  })
  .on("readable", () => {
    const data = client_1.read();
    if (data) {
      console.log(`Received: ${data} (client)`);
    }
  });

const rl = readline.createInterface(process.stdin, process.stdout);

(async () => {
  while (true) {
    const answer = await rl.question("Type a message to send to the server: ");
    console.log("answer received:", answer);
    const buf = Buffer.from(answer, "utf16le");
    client_1.write(buf);
  }
})();

console.log("\nend of initial phase");
