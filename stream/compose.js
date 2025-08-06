const stream = require("stream");
const fs = require("fs");
const path = require("path");
const timersPromises = require("timers/promises");
const Buffer = require("buffer").Buffer;

(async () => {
  const readStreamFromFile = fs.createReadStream(
    path.join(__dirname, "files", "lorem_4kb.txt"),
    {
      highWaterMark: 64,
    }
  );

  const writeStreamToFile = fs.createWriteStream(
    path.join(__dirname, "files", "lorem_4kb_copy.txt"),
    {
      flags: "w",
      highWaterMark: 64,
    }
  );

  async function* asyncSourceGen() {
    yield* ["Lion", "Cat", "Leopard"];
  }
  function* syncSourceGen() {
    yield* ["Dog", "Wolf", "Fox"];
  }

  const asyncSourceGenObj = asyncSourceGen();
  const syncSourceGenObj = syncSourceGen();

  const plainIterable = ["Elephant", "Giraffe", "Zebra"];
  const plainAsyncIterable = {
    async *[Symbol.asyncIterator]() {
      yield* ["Monkey", "Orangutan", "Chimpanzee"];
    },
  };

  function* syncTransformGen(source) {
    for (const item of source) {
      yield item.toUpperCase();
    }
  }

  async function* asyncTransformGen(source) {
    for await (const item of source) {
      console.log("Processing item in async transform generator:", item);
      yield String(item).toUpperCase();
    }
  }

  const spaceRemover = new stream.Transform({
    // decodeStrings: false,
    defaultEncoding: "utf8",
    transform(chunk, encoding, callback) {
      console.log(
        "transform chunk type:",
        chunk.constructor.name,
        "value:",
        chunk
      );
      console.log("decodeStrings:", this._writableState.decodeStrings);
      const str = Buffer.isBuffer(chunk)
        ? chunk.toString(encoding === "buffer" ? "utf8" : encoding)
        : chunk;

      console.log("str:", typeof str);
      this.push(str.replace(" ", ""));
      callback();
    },
  });

  const duplex = stream.compose(
    spaceRemover,
    asyncTransformGen,
    writeStreamToFile
  );

  duplex.write("hello world", () => {
    console.log("Write completed");
  });

  duplex.on("data", (chunk) => {
    console.log(`Data received: ${chunk}`);
  });

  writeStreamToFile
    .on("finish", () => {
      console.log("Write stream finished successfully");
    })
    .on("close", () => {
      console.log("Write stream to file closed");
    });
})();
