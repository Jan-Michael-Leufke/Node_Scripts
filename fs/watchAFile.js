const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

console.log("-----");

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function debounceAsync(fn, delay) {
  let timer;
  let lastReject;
  return (...args) => {
    if (lastReject) {
      lastReject(new Error("Debounced call canceled"));
    }
    clearTimeout(timer);
    return new Promise((resolve, reject) => {
      lastReject = reject;
      timer = setTimeout(() => {
        lastReject = null;
        Promise.resolve(fn(...args))
          .then(resolve)
          .catch(reject);
      }, delay);
    });
  };
}

const watchFilePath = path.join(__dirname, "monitored", "commands.txt");
const abortController = new AbortController();
setTimeout(() => {
  abortController.abort();
}, (timeout = 20000));

const iterator = fsPromises.watch(watchFilePath, {
  encoding: "utf8",
  signal: abortController.signal,
});

(async () => {
  const fn = (event) => {
    console.count("debounced");
    console.log(`Event type: ${event.eventType}`);
    console.log(`File name: ${event.filename}`);

    // let fileHandle;

    return fsPromises
      .open(watchFilePath, "r+")
      .then((filehandle) =>
        filehandle.stat().then((stats) => ({ filehandle, stats }))
      )
      .then(({ filehandle, stats: { size: filesizeBytes } }) => {
        console.log(`File size: ${filesizeBytes} bytes`);
        const readInBuffer = Buffer.allocUnsafe(filesizeBytes);

        filehandle
          .read(readInBuffer, 0, readInBuffer.length, 0)
          .catch((err) => {
            console.error(`Error reading file: ${err.message}`);
          })
          .then(({ bytesRead, buffer }) => {
            console.log(`Read ${bytesRead} bytes from file`);
            const commandSplit = buffer.toString("utf8").split(" ");

            const filePath = path.join(__dirname, "created", commandSplit[1]);

            switch (commandSplit[0]) {
              case "createFile":
                return createFile(filePath);
              case "deleteFile":
                return deleteFile(filePath);
              case "appendFile":
                return appendFile(filePath, commandSplit.slice(2).join(" "));
              case "renameFile":
                return renameFile(filePath, commandSplit[2]);
              default:
                console.log("Unknown command");
                return Promise.resolve();
            }
          })
          .catch((err) => {
            console.error(`Error processing file: ${err.message}`);
          })
          .finally(() => {
            filehandle?.close();
          });
      })
      .catch((err) => {
        console.error(`Error opening file: ${err.message}, ${err.stack}`);
      });
  };

  let isProcessing = false;
  let cooldown = null;
  let pendingEvent = null;

  async function processNextEvent(event) {
    if (isProcessing) return;
    isProcessing = true;
    try {
      await debounceAsync(fn, 100)(event);
    } finally {
      isProcessing = false;
      cooldown = setTimeout(() => {
        cooldown = null;
      }, 400); // cooldown period (adjust as needed)
    }
  }

  try {
    for await (const event of iterator) {
      if (event.eventType === "change") {
        console.log("change detected...");
        // debouncedHandler(event).catch((err) => console.log("cancelled"));
        // await debouncedHandler(event);

        if (!isProcessing && !cooldown) {
          console.log("Processing event ...");
          processNextEvent(event);
        } else {
          console.log("ignored due to cooldown or processing");
        }
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Watching aborted");
    } else {
      console.error("Error during watching:", error);
    }
  }
})();

function createFile(filename) {
  return fsPromises.open(filename, "w").then((fileHandle) => {
    console.log(`File created: ${filename}`);
    return fileHandle.close();
  });
}

function deleteFile(filename) {
  return fsPromises.unlink(filename).then(() => {
    console.log(`File deleted: ${filename}`);
  });
}

function appendFile(filename, content) {
  return fsPromises.appendFile(filename, content).then(() => {
    console.log(`Content appended to file: ${filename}`);
  });
}

function renameFile(oldName, newName) {
  return fsPromises.rename(oldName, newName).then(() => {
    console.log(`File renamed from ${oldName} to ${newName}`);
  });
}

console.log("end of file");
