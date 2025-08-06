const stream = require("stream");
const fs = require("fs");
const path = require("path");
const timersPromises = require("timers/promises");
const Buffer = require("buffer").Buffer;

const [aSide, bSide] = stream.duplexPair();

const lorem = fs
  .readFileSync(path.join(__dirname, "files", "lorem_4kb.txt"), "utf-8")
  .substring(0, 256)
  .split(" ")
  .filter((word) => word.length > 1 || false);

const readStream = fs.createReadStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  {
    highWaterMark: 64,
  }
);

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_4kb_copy.txt"),
  {
    flags: "w",
    highWaterMark: 64,
  }
);

stream.finished(writeStream, (err) => {
  if (err) {
    console.error("Stream finished with error:", err);
  } else {
    console.log("Stream finished successfully");
  }
});

readStream.on("end", () => {
  writeStream.end("final line\n", () => {
    console.log("Write stream ended");
  });
});

readStream.on("data", (chunk) => {
  console.log(`Read ${chunk.length} bytes from readStream`);
  writeStream.write(chunk, (err) => {
    if (err) {
      console.error("Error writing to writeStream:", err);
    } else {
      console.log(`Wrote ${chunk.length} bytes to writeStream`);
    }
  });
});

stream.pipeline();
