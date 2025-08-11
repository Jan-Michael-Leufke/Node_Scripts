const path = require("node:path");
const stream = require("node:stream");
const fsPromises = require("node:fs/promises");

class MyWritableStream extends stream.Writable {
  constructor({
    highWaterMark = 1024,
    decodeStrings = true,
    fileName,
    batchSizeLimit = 400,
  }) {
    super({ highWaterMark, decodeStrings });

    this.fileHandle = null;
    this.fileName = fileName;
    this.batch = [];
    this.batchSize = 0;
    this.batchSizeLimit = batchSizeLimit;
  }

  _construct(callback) {
    fsPromises
      .open(path.join(__dirname, "files", "lorem_4kb_copy.txt"), "w")
      .then((fileHandle) => {
        this.fileHandle = fileHandle;
        callback(null);
      })
      .catch((err) => {
        callback(err);
      });
  }

  _write(chunk, encoding, callback) {
    this.batch.push({ chunk, encoding });
    this.batchSize += Buffer.byteLength(chunk, encoding);
    console.log("current batch size:", this.batchSize);

    if (this.batchSize < this.batchSizeLimit) {
      setTimeout(() => {
        callback();
      }, 100);

      return;
    }

    this.#handleFlush(callback);
  }

  _final(callback) {
    console.log("Finalizing stream...");
    if (this.batch.length === 0) {
      callback();
      return;
    }

    this.#handleFlush(callback);
  }

  #handleFlush(callback) {
    const buffers = this.batch.map(({ chunk, encoding }) =>
      Buffer.from(chunk, encoding)
    );

    const concatenated = Buffer.concat(buffers);

    this.fileHandle
      .write(concatenated)
      .then(() => {
        this.batch = [];
        this.batchSize = 0;
        console.log(`Wrote chunk of size: ${Buffer.byteLength(concatenated)}`);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  }
}

const myWriteStream = new MyWritableStream({ decodeStrings: false });

fsPromises
  .readFile(path.join(__dirname, "files", "lorem_4kb.txt"), "utf8")
  .then((data) => {
    function* makeIterable(str, size = 64) {
      let offset = 0;
      while (offset < str.length) {
        yield str.slice(offset, offset + size);
        offset += size;
      }
    }

    const stringChunks = [...makeIterable(data)];

    let ended = false;

    const processWrite = () => {
      while (stringChunks.length > 0) {
        console.log("write invoked");

        if (!myWriteStream.write(stringChunks.shift(), "utf8")) {
          console.error("Backpressure!");
          myWriteStream.once("drain", processWrite);
          return;
        }
      }

      if (stringChunks.length === 0 && !ended) {
        ended = true;
        myWriteStream.end();
      }
    };

    processWrite();
  })
  .catch((err) => {
    console.error("Error reading file:", err);
  });

console.log("end of user code");
