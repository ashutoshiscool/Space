const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: "/home/ubuntu/space", encoding: "utf8" });
    console.log(out);
    return out;
  } catch (err) {
    console.error(`ERROR running ${cmd}:`, err.message);
    if (err.stdout) console.log("STDOUT:", err.stdout);
    if (err.stderr) console.error("STDERR:", err.stderr);
    throw err;
  }
}

try {
  run("git --no-pager branch");
  run("git --no-pager remote -v");
  run("git --no-pager status -s");
} catch (e) {
  process.exit(1);
}
