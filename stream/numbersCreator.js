const { open } = require("node:fs/promises");
const { join } = require("node:path");

function createNumbersFile(byteSize) {
  const mb1 = 1024 * 1024;
  let i = 0;
  let bytesWritten = 0;

  if (!byteSize) {
    byteSize = mb1;
  }

  console.time("createNumbersFile");

  return open(join(__dirname, "files", `numbers_${byteSize}.txt`), "w")
    .then((fileHandle) => {
      console.log(
        "-------------------Create Numbers File---------------------"
      );
      const writeStream = fileHandle.createWriteStream();

      return new Promise((resolve, reject) => {
        writeStream
          .on("error", (err) => {
            reject(err);
          })
          .on("finish", () => {
            console.log("Finished writing to file");
          })
          .on("close", () => {
            console.log("Numbers Write stream closed");
            resolve({ confirmedBytesWritten, lastNumberWritten });
          });

        let confirmedBytesWritten = 0;
        let lastNumberWritten = -1;

        const write = () => {
          while (true) {
            if (bytesWritten > byteSize) {
              writeStream.end();
              return;
            }
            const buf = Buffer.from(` ${i++} `, "utf-8");
            bytesWritten += buf.length;
            const current = i;
            const currentBytesWritten = bytesWritten;
            if (
              !writeStream.write(buf, () => {
                confirmedBytesWritten += buf.length;
                lastNumberWritten = current;
                // console.log(`Wrote number: ${lastNumberWritten}`);
                // console.log(
                //   `scheduled/confirmed bytes written so far: ${currentBytesWritten} ${confirmedBytesWritten}`
                // );
              })
            ) {
              writeStream.once("drain", () => {
                console.log(
                  "continue after drain at " + currentBytesWritten + " bytes"
                );
                write();
              });
              break;
            }
          }
        };
        try {
          write();
        } catch (err) {
          reject(err);
        }
      });
    })
    .then(({ confirmedBytesWritten, lastNumberWritten }) => {
      console.log(`Total bytes written: ${confirmedBytesWritten}`);
      console.log(`Numbers written: 0 - ${lastNumberWritten - 1}`);
      console.log(`Bytes overshoot by: ${confirmedBytesWritten - byteSize}`);
      console.log(`created file: numbers_${byteSize}.txt`);
    })
    .catch((err) => {
      console.log("Error in createNumbersFile:", err);
      throw err;
    })
    .finally(() => {
      console.timeEnd("createNumbersFile");
      console.log(
        "------------------------------------------------------------"
      );
    });
}

module.exports = createNumbersFile;
