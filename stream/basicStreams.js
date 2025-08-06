const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { text } = require("stream/consumers");

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "numbers_small.txt"),
  {
    highWaterMark: 16,
    flags: "w",
  }
);

function writeNumbers(start = 0, limit = 100) {
  const callback = function (err) {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`Number ${this} written to file.`);
    }
  };

  (function writeNext(start) {
    if (start >= limit) {
      writeStream.end(() => {
        console.log("All numbers written to file.");
      });
      return;
    }
    if (!writeStream.write(`${start++}, `, "utf8", callback.bind(start))) {
      console.log("Write buffer is full, waiting for drain event...");
      writeStream.once("drain", () => {
        console.log("Drain event received, continuing to write...");
        writeNext(start);
      });
    } else {
      process.nextTick(() => {
        writeNext(start);
      });
    }
  })(start);
}

writeNumbers(0);

const textWriter = fs.createWriteStream(
  path.join(__dirname, "files", "text_output.txt"),
  { flags: "w", highWaterMark: 64 }
);

textWriter
  .on("error", (err) => {
    console.error("Error in write stream:", err);
  })
  .on("open", () => {
    console.log("Write stream opened");
  })
  .on("close", () => {
    console.log("Write stream closed");
  })
  .on("drain", () => {
    console.log("Drain event emitted");
  });

let line = 0;
const writeText = function () {
  while (textWriter.write("This is a line of text.\n")) {
    line++;
    console.log("Line " + line + " written to buffer.");
  }
  console.log("Write buffer is full, waiting for drain event...");
  textWriter.once("drain", () => {
    console.log("Drain event received, continuing to write...");

    setTimeout(() => {
      writeText();
    }, 1000);
  });
  console.log("Write operation initiated, waiting for drain event...");
};

setTimeout(() => {
  textWriter.end("last line", () => {
    console.log("Write stream ended.");
  });
}, (timeout = 5000));

writeText();

console.log("end of initial phase");
