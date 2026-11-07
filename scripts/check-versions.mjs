// プラグインの版（.claude-plugin/plugin.json）と、各スキルの版、CHANGELOG.md の見出しがそろっているかを検査する。
// スキルの版は、frontmatter の metadata.version と、本文の「このスキルの版: X.Y.Z」の2か所に書く
// （本文はモデルが読む。frontmatter はモデルに渡らないことがあるため）。
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

// frontmatter の metadata の直下（metadata より1段深い字下げ）にある version だけを読む。
function metadataVersion(frontmatter) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => /^metadata:\s*$/.test(line));
  if (start < 0) return undefined;
  let indent;
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    const current = line.match(/^[ \t]*/)[0].length;
    if (current === 0) break; // metadata の外に出た
    indent ??= current;
    if (current !== indent) continue; // さらに深い入れ子は見ない
    const m = line.match(/^[ \t]+version:[ \t]*["']?([^"'\s]+)["']?[ \t]*$/);
    if (m) return m[1];
  }
  return undefined;
}

const skillsDir = join(root, "skills");
for (const name of readdirSync(skillsDir)) {
  const file = join(skillsDir, name, "SKILL.md");
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    errors.push(`${file}: frontmatter が無い`);
    continue;
  }
  const [, frontmatter, body] = match;

  const fmVersion = metadataVersion(frontmatter);
  if (!fmVersion) {
    errors.push(`${file}: frontmatter に metadata.version が無い`);
  } else if (fmVersion !== version) {
    errors.push(`${file}: metadata.version ${fmVersion} が plugin.json の ${version} と違う`);
  }

  const bodyVersions = [...body.matchAll(/^このスキルの版: (\S+)$/gm)].map((m) => m[1]);
  if (bodyVersions.length !== 1) {
    errors.push(`${file}: 本文に「このスキルの版: X.Y.Z」の行がちょうど1つ無い（${bodyVersions.length} 個）`);
  } else if (bodyVersions[0] !== version) {
    errors.push(`${file}: 本文の版 ${bodyVersions[0]} が plugin.json の ${version} と違う`);
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
