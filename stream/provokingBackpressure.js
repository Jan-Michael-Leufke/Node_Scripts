printArrayBufferMemoryUsage();

const fs = require("fs");
const path = require("path");
const os = require("os");

function printArrayBufferMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  console.log(
    `Memory usage (array buffers): ${memoryUsage.arrayBuffers} bytes`
  );
}

const readStream = fs.createReadStream(
  path.join(__dirname, "files", "lorem_100kb.txt"),
  {
    highWaterMark: 512,
  }
);

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_100kb_destination.txt"),
  {
    flags: "w",
    highWaterMark: 64,
  }
);

readStream.on("end", () => {
  console.log("Read stream ended");
  writeStream.uncork();
  writeStream.end(() => {
    console.log("[Debug callback from writeStream.end()] - Write stream ended");
  });
});

writeStream
  .on("drain", () => console.log("Write stream drained"))
  .on("finish", () => {
    console.log("Write stream finished");
  })
  .on("close", () => {
    console.log("Write stream closed");
    printArrayBufferMemoryUsage();
  })
  .cork();

readStream.addListener("data", (chunk) => {
  console.log(chunk.length, "bytes read");

  printArrayBufferMemoryUsage();

  if (
    !writeStream.write(chunk, () =>
      console.log(`Chunk of size ${chunk.length} written to file`)
    ) &&
    writeStream.writableLength >= 1024 * 50
  ) {
    console.log(
      "writeStream buffer is at 50KB, pausing readStream, wating for drain event..."
    );
    readStream.pause();
    writeStream.uncork();

    writeStream.once("drain", () => {
      console.log("Drain event received, resuming readStream");
      writeStream.cork();
      readStream.resume();
    });
  }

  console.log(writeStream.writableLength, "bytes in the write buffer");
});
