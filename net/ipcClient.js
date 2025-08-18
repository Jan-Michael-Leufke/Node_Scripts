const net = require("node:net");
const frameDelimiter = "\n";

const client = net
  .createConnection({ path: "/tmp/test.sock" }, () => {
    console.log("IPC client connected");

    postConnectHandler();
  })
  .on("data", (data) => {
    console.log("IPC client received:", data.toString());
  });

function postConnectHandler() {
  client.write("Hello, IPC server some serialized data will come flying in!\n");
  client.write(JSON.stringify(testObj) + frameDelimiter);
  client.end("that's it bye");
}

const testObj = {
  key: "value",
  anotherKey: "anotherValue",
  someNumber: 42,
  nestedObject: {
    nestedKey: "nestedValue",
  },
  someArray: [1, 2, 777],
  someFunction: function* () {
    yield* this.someArray;
  },
  [Symbol.iterator]: function* () {
    yield* Object.values(this);
  },
};
