const { log, dir } = require("node:console");
const { spawn, exec } = require("node:child_process");
const fs = require("node:fs");

log(process.argv);
log(process.env);
log(`Process PID: ${process.pid}, Parent PID: ${process.ppid}`);

const runSpawn = function () {
  const pythonProc = spawn(
    "python3.13",
    [`${__dirname}/script.py`, `${__dirname}/../Shell/output.py`],
    {
      env: { ...process.env, MODE: "production" },
    }
  );

  pythonProc.stdout.on("data", (data) => {
    log(data.toString());
  });

  const cProc = spawn(`${__dirname}/script`, ["test", "arg2"], {
    env: { MODE: "testing" },
  });

  cProc.stdout.on("data", (data) => {
    log(data.toString());
  });
};

const runExec = function () {
  exec(
    "source ~/.zshrc && echo 'Hello, World and some more words!' | tr ' ' '\n' && retjs",
    { shell: "/bin/zsh" },
    (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        return;
      }

      log(`Stderr: ${stderr}`);
      log(`Stdout: ${stdout}`);
    }
  );
};

const runExec2 = function () {
  exec(
    `source ~/.zshrc && retjs && echo  $$`,
    { shell: "/bin/zsh" },
    (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        return;
      }

      log(`Stderr: ${stderr}`);
      log(`Stdout: ${stdout}`);
    }
  );
};

runSpawn();
// runExec2();
// log("node pid: " + process.pid);
// log("parent pid: ", process.ppid);
