const http = require("http");
const net = require("node:net");
const { log, dir } = require("node:console");

module.exports = class IcpAgent extends http.Agent {
  constructor(options) {
    super(options);
  }

  createConnection(options, callback) {
    return net.createConnection({ path: options.socketPath });
    // callback(socket);
  }
};
