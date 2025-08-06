const stream = require("stream");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

(async () => {
  const fileHandle = await fsPromises.open(
    path.join(__dirname, "files", "lorem_4kb.txt"),
    "r"
  );

  const readStream = fileHandle.createReadStream({
    highWaterMark: 1024,
    // encoding: "utf8",
  });

  // Instance-level patch to count actual bytes read from OS for this stream only
  //  does not seem to work via monkeypatching without touching C++ internals/bindings
  //  since node uses native fs.read at least here on this platform(linux),
  // however, we can still patch the _read method
  let bytesReadFromSource = 0;
  let bytesRequestedFromSource = 0;
  const origRead = readStream._read;

  readStream._read = function (size) {
    const self = this;
    bytesRequestedFromSource += size;
    console.log(
      `[INTERNAL _read] Stream is requesting ${size} bytes from the source (fd: ${self.fd})`
    );

    const origFsRead = self.fd && fs.read;
    const origFsReadv = self.fd && fs.readv;

    if (self.fd && (origFsRead || origFsReadv)) {
      if (origFsRead) {
        fs.read = function (fd, buffer, offset, length, position, callback) {
          const wrappedCallback = function (err, bytesRead, ...rest) {
            if (bytesRead > 0) {
              bytesReadFromSource += bytesRead;
              console.log(
                `[INSTANCE PATCH] Actually read ${bytesRead} bytes from source (fd: ${fd}), total so far: ${bytesReadFromSource}`
              );
            }
            return callback.apply(this, [err, bytesRead, ...rest]);
          };
          return origFsRead.call(
            this,
            fd,
            buffer,
            offset,
            length,
            position,
            wrappedCallback
          );
        };
      }

      //even patching the vectorized read doesnt seem to work
      // so bytesreadFromSource will not be accurate
      if (origFsReadv) {
        fs.readv = function (fd, buffers, position, callback) {
          const wrappedCallback = function (err, bytesRead, ...rest) {
            if (bytesRead > 0) {
              bytesReadFromSource += bytesRead;
              console.log(
                `[INSTANCE PATCH] Actually readv ${bytesRead} bytes from source (fd: ${fd}), total so far: ${bytesReadFromSource}`
              );
            }
            return callback.apply(this, [err, bytesRead, ...rest]);
          };
          return origFsReadv.call(this, fd, buffers, position, wrappedCallback);
        };
      }

      origRead.call(self, size);
      if (origFsRead) fs.read = origFsRead;
      if (origFsReadv) fs.readv = origFsReadv;
      sx;
    } else {
      origRead.call(self, size);
    }
  };

  const writeStream = fs.createWriteStream(
    path.join(__dirname, "files", "lorem_4kb_copy.txt"),
    { flags: "w" }
  );

  console.log(
    readStream[
      Object.getOwnPropertyNames(
        Object.getPrototypeOf(readStream.__proto__)
      ).filter((prop) => prop === "read")[0]
    ]
  );

  readStream.on("end", () => {
    console.log("Stream ended");
  });

  readStream.on("pause", () => {
    console.log("Stream paused");
  });

  readStream.on("resume", () => {
    console.log("Stream resumed");
  });

  let bytesDeliveredToUser = 0;

  function runStreamAsync() {
    return new Promise((resolve, reject) => {
      let iteration = 0;
      let chunkRequestSize;

      const listener = () => {
        try {
          console.log("readable event!");
          console.log("Iteration: ", ++iteration);

          chunkRequestSize = undefined;

          if (iteration === 2) {
            chunkRequestSize = 1;
            throw new Error("test error");
          }

          if (iteration === 3) {
            readStream.off("readable", listener);
            console.log(
              `Stopping readable event listener after 3 iterations. flowing: ${readStream.readableFlowing}, buffer length: ${readStream.readableLength} `
            );
            resolve();
            // return;
          }

          console.log("readable flowing: ", readStream.readableFlowing);
          console.log("buffer length: ", readStream.readableLength);

          const chunk = readStream.read(chunkRequestSize);

          addToBytesDeliveredSum(chunk);
          logStreamInfo();
        } catch (err) {
          console.log("Error in readable event listener:", err);
          const chunk = readStream.read(chunkRequestSize || undefined);
          addToBytesDeliveredSum(chunk);
          logStreamInfo();

          readStream.off("readable", listener);
          return reject(err);
        }
      };
      console.error("readable flowing: ", readStream.readableFlowing);
      readStream.on("readable", listener);
    });

    function logStreamInfo() {
      console.log(
        "Total bytes delivered to user so far:",
        bytesDeliveredToUser
      );
      console.log(
        "Total bytes requested from source so far:",
        bytesRequestedFromSource
      );

      console.log("buffer length after read:", readStream.readableLength);
    }

    function addToBytesDeliveredSum(chunk) {
      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          bytesDeliveredToUser += chunk.length;
        } else {
          bytesDeliveredToUser += Buffer.byteLength(
            chunk,
            readStream.readableEncoding || "utf8"
          );
        }
        console.log("[Userland] Read chunk of size:", chunk.length);
      } else {
        console.log("No data read");
      }
    }
  }

  runStreamAsync()
    .then(() => {
      console.log("Stream processing completed");
      console.log(
        `Total bytes delivered to user: ${bytesDeliveredToUser}, Total bytes requested from source: ${bytesRequestedFromSource}`
      );
      fileHandle.close();
    })
    .catch((err) => {
      console.error("Error during stream processing:", err);
    });
})();
