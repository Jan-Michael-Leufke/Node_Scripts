const MyReadableStream = require("./customReadable.js");
const MyWritableStream = require("./implementWriteStream.js");
const path = require("path");

const myReadStream = new MyReadableStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  { highWaterMark: 64 }
)
  .on("end", () => {
    console.log("end event, No more data to read.");
    myWriteStream.end();
  })
  .on("error", (err) => {
    console.error(`Error occurred: ${err.message}`);
  })
  .on("close", () => {
    console.log("close event, Stream closed.");
  });
//   .on("data", (chunk) => {
//     console.log(`Received ${chunk.length} bytes of data.`);
//   });

const myWriteStream = new MyWritableStream({})
  .on("finish", () => {
    console.log("All data written.");
  })
  .on("error", (err) => {
    console.error(`Error occurred: ${err.message}`);
  });

(async () => {
  for await (const chunk of myReadStream) {
    if (!myWriteStream.write(chunk)) {
      await new Promise((resolve) => {
        myWriteStream.once("drain", resolve);
      });
    }
  }
})();

console.log("end of user code");
