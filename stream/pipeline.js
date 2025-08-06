const stream = require("stream");
const fs = require("fs");
const path = require("path");
const timersPromises = require("timers/promises");

const readStream = stream.Readable.from(["a", "b", "c", "d", "e", "f"]);

const src = fs.createReadStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  {
    highWaterMark: 64,
  }
);
const dest = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_4kb_copy.txt"),
  {
    flags: "w",
    highWaterMark: 64,
  }
);

async function* source() {
  yield* ["a", "b", "c"];
}

async function consume(asyncIterable) {
  for await (const chunk of asyncIterable) {
    console.log(chunk);
  }

  return "done";
}

async function* transformer(asyncIterable) {
  for await (const chunk of asyncIterable) {
    yield chunk.toUpperCase();
  }
  yield "transformed";
}

(async function () {
  const result = stream.pipeline(source(), transformer, consume, (err, val) => {
    if (err) {
      console.error("Pipeline failed:", err);
    } else {
      console.log("Pipeline succeeded");
      console.log("Final value:", val);
    }
  });
  console.log(Object.getPrototypeOf(result).constructor.name);
})();

dest
  .on("finish", () => {
    console.log("Write stream finished");
  })
  .on("close", () => {
    console.log("Write stream closed");
  });
