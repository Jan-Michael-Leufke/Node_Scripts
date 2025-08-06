const fs = require("fs");
const path = require("path");

const readStream = fs.createReadStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  { highWaterMark: 256 }
);

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_4kb_copy.txt"),
  { flags: "w", highWaterMark: 1024 }
);

writeStream.cork();

function processChunk() {
  let chunk;

  while (null !== (chunk = readStream.read())) {
    console.log(`Read chunk of size: ${chunk.length}`);
    if (
      !writeStream.write(chunk, function () {
        console.log(
          `Write operation completed  current writable buffer: ${writeStream.writableLength} bytes`
        );
      })
    ) {
      writeStream.uncork();
      console.log(`Wrote chunk of size: ${chunk.length}`);
      console.log("Write buffer is full, waiting for drain event...");
      console.log(writeStream.writableLength, "bytes in the write buffer");
      readStream.off("readable", readableListener);
      writeStream.once("drain", () => {
        console.log("Drain event received, continuing to write...");
        readStream.on("readable", readableListener);
        writeStream.cork();
      });
      break;
    } else {
      console.log(`Wrote chunk of size: ${chunk.length}`);
    }
  }
  console.log("No more data to read in this chunk");
}

function readableListener() {
  console.log("readable event triggered");
  processChunk();
}

readStream.on("readable", readableListener);
