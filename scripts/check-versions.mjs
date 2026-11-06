// プラグインの版（.claude-plugin/plugin.json）と、各スキルの版（SKILL.md の metadata.version）、
// CHANGELOG.md の見出しがそろっているかを検査する。
// スキルは自分の版を MCP サーバーが求める最も古い版と比べるので、ずれると誤った案内をする。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? ".";
const errors = [];

const plugin = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
const version = plugin.version;
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  errors.push(`plugin.json の version が X.Y.Z の形ではない: ${version}`);
}

const skillsDir = join(root, "skills");
for (const name of readdirSync(skillsDir)) {
  const file = join(skillsDir, name, "SKILL.md");
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  const skillVersion = frontmatter?.[1].match(/^metadata:\n(?:[ \t]+.*\n)*?[ \t]+version:[ \t]*["']?([^"'\s]+)/m)?.[1];
  if (!skillVersion) {
    errors.push(`${file}: frontmatter に metadata.version が無い`);
  } else if (skillVersion !== version) {
    errors.push(`${file}: metadata.version ${skillVersion} が plugin.json の ${version} と違う`);
  }
}

const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const latest = changelog.match(/^## \[?(\d+\.\d+\.\d+)\]?/m)?.[1];
if (latest !== version) {
  errors.push(`CHANGELOG.md の最新の見出し ${latest} が plugin.json の ${version} と違う`);
}

if (errors.length > 0) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(`版はそろっている: ${version}`);
