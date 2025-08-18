const fs = require("node:fs");
const stream = require("node:stream");
const { Buffer } = require("node:buffer");

module.exports = class MyReadableStream extends stream.Readable {
  constructor(filepath, options) {
    super(options);

    this.filepath = filepath;
    this.fd = null;
    this.readposition = 0;
  }

  _construct(callback) {
    fs.open(this.filepath, "r", (err, fd) => {
      if (err) {
        callback(err);
        return;
      }
      this.fd = fd;
      console.log(`File opened: ${this.filepath}`);
      callback();
    });
  }

  _destroy(error, callback) {
    console.log(`Destroying stream for file: ${this.filepath}`);
    if (this.fd) {
      fs.close(this.fd, (err) => {
        if (err) {
          callback(err);
          return;
        }
        this.fd = null;
        callback(error);
      });
    } else {
      callback(error);
    }
  }

  _read(size) {
    console.log(`_read invokation: Reading ${size} bytes`);
    const buffer = Buffer.alloc(size);
    fs.read(this.fd, buffer, 0, size, this.readposition, (err, bytesRead) => {
      if (err) {
        this.destroy(err);
        return;
      }

      if (bytesRead === 0) {
        console.log("End of file reached. pushing null");
        this.push(null);
        return;
      }

      this.readposition += bytesRead;

      setTimeout(() => {
        console.log(`Pushing ${bytesRead} bytes to internal buffer`);
        this.push(buffer.subarray(0, bytesRead));
      }, 100);
    });
  }
};
