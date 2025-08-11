const createnumbers = require("./numbersCreator.js");
const fsPromises = require("node:fs/promises");
const { join } = require("node:path");

const byteSize = 100000;

(async () => {
  await createnumbers(byteSize);

  console.log(`Created numbers file with size: ${byteSize} bytes`);

  fsPromises
    .open(join(__dirname, "files", `numbers_${byteSize}.txt`), "r")
    .then((source) => {
      return fsPromises
        .open(join(__dirname, "files", `numbers_${byteSize}_copy.txt`), "w")
        .then((destination) => {
          const buffer = Buffer.alloc(8192);
          const processCopying = () => {
            return source.read(buffer).then(({ bytesRead }) => {
              if (bytesRead === 0) {
                destination.close();
                source.close();
                console.log(`Finished copying closing source and destination`);
                return;
              }
              return destination
                .write(buffer.subarray(0, bytesRead))
                .then(() => {
                  console.log(
                    `Copied ${bytesRead} bytes to numbers_${byteSize}_copy.txt`
                  );
                  console.log(`buffer size is ${buffer.length} bytes`);
                  return processCopying();
                });
            });
          };

          return processCopying().then(() => {
            console.log(`Finished copying to numbers_${byteSize}_copy.txt`);
          });
        });
    })
    .then(() => {
      console.log("in the outermost then");
    });
})();

console.log("end of user code");
