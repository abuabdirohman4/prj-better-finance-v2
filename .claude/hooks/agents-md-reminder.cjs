#!/usr/bin/env node
// Stop hook: kalau ada file src/ berubah sesi ini, ingatkan cek AGENTS.md.
// ponytail: git diff sekali, no state. Nempel di project settings.json Stop.
const { execSync } = require("child_process");
try {
  const out = execSync("git diff --name-only HEAD -- src/ 2>/dev/null", {
    encoding: "utf8",
  }).trim();
  if (out) {
    const n = out.split("\n").length;
    process.stderr.write(
      `\n📝 ${n} file src/ berubah sesi ini. Cek AGENTS.md: ada pattern/gotcha/konvensi baru yang perlu didokumentasikan? (pakai # buat auto-append)\n`,
    );
  }
} catch {
  // no git / no repo — diam
}
