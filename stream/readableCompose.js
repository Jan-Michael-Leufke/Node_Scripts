const { Readable } = require("node:stream");
const fs = require("node:fs");
const path = require("node:path");

const readStream = fs.createReadStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  { highWaterMark: 64 }
);

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_4kb_destination.txt"),
  { flags: "w", highWaterMark: 64 }
);

(async () => {
  async function* splitSourceWords_OrYieldFixed(source) {
    if (!source) {
      yield* [0x1, 0x02, 0x03, 0xab]; // Fixed yield if no source provided
      return;
    }

    let leftover = "";
    for await (const chunk of source) {
      const text = leftover + String(chunk);
      const words = text.split(" ");
      leftover = words.pop();
      for (const word of words) {
        yield word;
      }
    }
    if (leftover) yield leftover;
  }

  const wordsStream = readStream
    .compose(splitSourceWords_OrYieldFixed)
    .on("data", (word) => {
      if (!writeStream.write(word + "\n")) {
        wordsStream.pause();
        console.log("Write stream buffer is full, waiting for drain...");
        writeStream.once("drain", () => {
          console.log("Drain event received, continuing to write...");
          wordsStream.resume();
        });
      }
    });
})();
