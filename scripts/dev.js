// Trust the OS certificate store so local dev can reach Resend, Supabase, Google Fonts, etc.
// behind antivirus/proxy HTTPS inspection. `--use-system-ca` needs Node 22.15+ / 23.8+.
const { spawn } = require("child_process");

const [major, minor] = process.versions.node.split(".").map(Number);
const supportsSystemCa = major > 23 || (major === 23 && minor >= 8) || (major === 22 && minor >= 15);

const env = { ...process.env };
if (supportsSystemCa && !/--use-system-ca/.test(env.NODE_OPTIONS || "")) {
  env.NODE_OPTIONS = `${env.NODE_OPTIONS || ""} --use-system-ca`.trim();
}

const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-p", "3004", ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
