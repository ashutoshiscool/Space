const { execSync } = require("child_process");

function run(cmd) {
  console.log(`\n=== Running: ${cmd} ===`);
  try {
    const out = execSync(cmd, {
      cwd: "/home/ubuntu/space",
      encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    console.log(out || "(no output)");
    return { ok: true, out };
  } catch (err) {
    console.error(`FAILED: ${cmd}`);
    if (err.stdout) console.log("STDOUT:", err.stdout);
    if (err.stderr) console.error("STDERR:", err.stderr);
    return { ok: false, err: err.stderr || err.message };
  }
}

// 1. Checkout unfinished branch
run("git checkout -B unfinished");

// 2. Stage changes
run("git add -A");

// 3. Commit
run('git commit -m "feat: complete space project summary, views flyout, stats cycle time, repository sync, and forms"');

// 4. Check status
run("git status -s");

// 5. Push to origin unfinished
const pushRes = run("git push -u origin unfinished");

if (!pushRes.ok) {
  console.log("\nPush failed. Checking remote URL and permissions...");
  run("git remote -v");
} else {
  console.log("\nSuccessfully pushed to branch 'unfinished'!");
}
