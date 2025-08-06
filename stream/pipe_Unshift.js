const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const readStream = fs
  .createReadStream(path.join(__dirname, "files", "lorem_4kb.txt"), {
    highWaterMark: 16,
  })
  .on("end", () => {
    console.log("Read stream ended");
  });

const writeStream = fs
  .createWriteStream(
    path.join(__dirname, "files", "lorem_4kb_destination.txt"),
    { flags: "w", highWaterMark: 16 }
  )
  .on("finish", () => {
    console.log("Write stream finished");
  });

console.log(Object.getOwnPropertyNames(writeStream.__proto__.__proto__));
console.dir(Object.getPrototypeOf(writeStream).__proto__, {
  showHidden: true,
  depth: 0,
});

function readableListener() {
  let chunk;
  console.log(`buffer length before read: ${readStream.readableLength} bytes`);
  chunk = readStream.read();
  console.log(`Read chunk of size: ${chunk.length} bytes`);
  console.log(`buffer length after read: ${readStream.readableLength} bytes`);

  if (chunk) {
    console.log(chunk.toString());
  }

  readStream.off("readable", readableListener);

  readStream.unshift(chunk);
  console.log(
    `buffer length after unshift: ${readStream.readableLength} bytes`
  );

  setTimeout(() => {
    readStream.on("readable", readableListener);
  }, 1000);
}

readStream.on("readable", readableListener);

// readStream.pipe(writeStream);
// setTimeout(() => {
//   console.log("Stop writing to destination");
//   readStream.unpipe(writeStream);
//   writeStream.end();
// }, 10);
