module.exports = {
  createBase36Id: function () {
    return Math.random().toString(36).substring(2, 15);
  },
};
