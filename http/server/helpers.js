const sessions = {};

function getSession(req) {
  const cookie = req.headers.cookie || "";
  const sessionId = cookie
    .split("; ")
    .find((c) => c.startsWith("sessionId="))
    ?.split("=")[1];
  return sessionId && sessions[sessionId];
}

module.exports = {
  getSession,
  sessions,
};
