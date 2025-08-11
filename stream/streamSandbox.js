const stream = require("node:stream");
const fs = require("node:fs");

const readStream = fs.createReadStream(
  `${process.cwd()}/stream/files/lorem_4kb.txt`,
  { highWaterMark: 256 }
);
const writeStream = fs.createWriteStream(
  `${process.cwd()}/stream/files/lorem_4kb_copy.txt`,
  { highWaterMark: 64 }
);

const numbOfWrites = 1000;
let i = 0;

const writeMany = () => {
  while (i < numbOfWrites) {
    const buf = Buffer.from(` ${i} `, "utf8");
    if (i === numbOfWrites - 1) {
      return writeStream.end(buf);
    }

    if (!writeStream.write(buf)) {
      writeStream.once("drain", () => {
        writeMany();
      });
      break;
    }

    i++;
  }
};

writeMany();
