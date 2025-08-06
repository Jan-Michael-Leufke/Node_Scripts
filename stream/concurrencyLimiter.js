const stream = require("stream");
const fs = require("fs");
const path = require("path");
const timersPromises = require("timers/promises");

const lorem = fs
  .readFileSync(path.join(__dirname, "files", "lorem_4kb.txt"), "utf-8")
  .substring(0, 256)
  .split(" ")
  .filter((word) => word.length > 1 || false); // 256 characters from lorem text

const nums = Array.from({ length: 20 }, (_, i) => i + 1);
const strings = Array.from({ length: 20 }, (_, i) => `String ${i + 1}`);

const readStream_Utf8 = fs.createReadStream(
  path.join(__dirname, "files", "lorem_4kb.txt"),
  { highWaterMark: 256, encoding: "utf-8" }
);

const writeStream = fs.createWriteStream(
  path.join(__dirname, "files", "lorem_4kb_copy.txt"),
  { flags: "w", highWaterMark: 1024 }
);

const upper = new stream.Transform({
  transform(chunk, enc, cb) {
    this.push(chunk.toString().toUpperCase());
    cb(null);
  },
});

ac = new AbortController();
const { signal } = ac;

const predicate = async (element, { signal }) => {
  console.log("start processing:", element);
  await new Promise((r) => setTimeout(r, 1000));
  console.log("end processing:", element);
  return element.length > 0;
};

const concurrencyLimit = 4;
const promises = [];
let activeCount = 0;

async function concurrencyLimiter(chunk, predicate) {
  while (activeCount >= concurrencyLimit) {
    await Promise.race(promises);
  }
  activeCount++;
  console.log("active promises added", activeCount);
  const p = predicate(chunk)
    .then(async () => await timersPromises.scheduler.wait(1000))
    .finally(() => {
      activeCount--;
      console.log("active promises removed", activeCount);
      promises.splice(promises.indexOf(p), 1);
    });
  promises.push(p);
}

async function streamMap() {
  for await (const chunk of stream.Readable.from([...lorem]).map(
    (chunk) => {
      return chunk.toUpperCase();
    },
    { concurrency: 4 }
  )) {
    console.log("Mapped chunk with concurrency limit:", chunk);
  }
}

async function streamFilter_customLimiting() {
  const res = (async () => {
    for await (const chunk of stream.Readable.from([...lorem])) {
      concurrencyLimiter(chunk, async (element) => console.log(element));
    }
  })();
}

async function streamFilter() {
  const res = (async () => {
    for await (const chunk of stream.Readable.from([...lorem]).filter(
      (chunk) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log("Processing chunk:", chunk);
            resolve(chunk.length > 5);
          }, 500);
        });
      },
      { concurrency: 4, highWaterMark: 8, signal }
    )) {
      console.log("Filtered chunk:", chunk);
    }
  })();
}

async function streamForEach() {
  stream.Readable.from([...lorem])
    .forEach(
      (chunk) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log("Chunk:", chunk);
            resolve();
          }, (timeout = 1000));
        });
      },
      { signal, concurrency: 3 }
    )
    .then(() => console.log("All chunks processed"));
}

async function streamReducer() {
  const assembledText = await stream.Readable.from([...lorem])
    .flatMap((chunk) => {
      return [chunk.toUpperCase(), chunk.toLowerCase()];
    })
    .reduce((acc, chunk) => {
      acc += chunk + " ";
      return acc;
    }, "");

  console.log("Assembled text:", assembledText);
}

async function streamReducerAsyncGen() {
  const assembledText = await stream.Readable.from([...lorem])
    .flatMap(async function* (chunk) {
      yield* [chunk.toUpperCase(), chunk.toLowerCase()];
    })
    .reduce((acc, chunk) => (acc += chunk + " "), "");

  console.log("Assembled text:", assembledText);
}

streamReducerAsyncGen();

console.log("end of user code");
