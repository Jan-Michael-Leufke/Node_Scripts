const net = require("node:net");
const fs = require("node:fs");

//ipc shared sockets don't work in a single process and fd's are process specific
//have to later tweak it to using child process

const fdOptionIndex = process.argv.indexOf("--fd");
let listeningSocketFdFromOptions = null;
const listeningOptions = { reusePort: false };
console.log(fdOptionIndex);

if (fdOptionIndex !== -1) {
  const fd = parseInt(process.argv[fdOptionIndex + 1], 10);
  if (!isNaN(fd)) {
    listeningOptions.fd = fd;
    console.log("fd added to options");
  }
} else {
  if (fs.existsSync("/tmp/test.sock")) {
    fs.unlinkSync("/tmp/test.sock");

    listeningOptions.path = "/tmp/test.sock";
  }
}

const server = net.createServer({ pauseOnConnect: true }, (socket) => {
  console.log(`IPC connection coming in`);

  let stringBuffer = "";
  const frameDelimiter = "\n";

  socket
    .on("data", (data) => {
      stringBuffer += data.toString();
      let lines = stringBuffer.split(frameDelimiter);

      stringBuffer = lines.pop();

      for (const line of lines) {
        if (line.trim() === "") {
          console.log("Received empty line");
          continue;
        }
        try {
          const parsedData = JSON.parse(line);
          console.log("Parsed IPC data:", parsedData);
        } catch {
          console.log("Received IPC data:", line);
        }
      }
    })
    .on("end", () => {
      if (stringBuffer) {
        console.log("Remaining data in buffer:", stringBuffer);
      }
      socket.end("bye from IPC server");
      console.log("IPC connection ended");
    });

  socket.resume();
});

server.listen(listeningOptions, () => {
  console.log(
    `Process: ${process.pid}, IPC server listening on fd: ${
      server._handle.fd
    }, path: ${server.address()}`
  );
});
