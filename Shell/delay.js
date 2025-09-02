console.log("output.js started, 20 secs countdown");
console.log("pid: ", process.pid);
setTimeout(() => {
  console.log("Hello world Javascript after 20 secs");
}, 20000);
