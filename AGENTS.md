# AGENTS.md

STANDARD Issue Tracker 用の Claude Code プラグインのリポジトリです。設計の判断は `docs/adr/` にあります。

## 必ず守ること

- **このリポジトリは公開されている。** Issue Tracker の接続先の URL、社内のプロジェクト名・プロジェクトキー・リポジトリ名、取引先や作品の事情を書かない。例は `acme/...` のような架空の名前で書く。
  - 例外: このリポジトリの課題を管理するプロジェクトの課題キー（`<キー>-<番号>`）だけは、ブランチ名・コミットのメッセージ・PR の件名と本文・PR のコメントに書いてよい（ADR 0011）。
    課題の URL、ほかのプロジェクトのキー、課題に書いた社内の事情は、そこにも書かない。ファイルの中身（文書・例・スキル）には、課題キーも書かない。
- API キーなどの秘密情報を書かない。プラグインは MCP サーバーの設定を含まない（ADR 0002）。
- 設定のファイルの書式（`docs/issue-workflow-format.md`）やコメントの印（`docs/comment-markers.md`）を変えたら、版を上げて CHANGELOG に書く。書式を壊す変更では、`format` の番号を上げる。
- 版は `.claude-plugin/plugin.json` の `version`、各スキルの `metadata.version` と本文の「このスキルの版」、`CHANGELOG.md` の最新の見出しをそろえる。上げないと利用者に届かない。
- 編集したら `node scripts/check-versions.mjs`、`markdownlint-cli2`、`claude plugin validate . --strict` を通す（CI と同じ）。
- `main` へ直接プッシュしない。ブランチを切って PR を出す。

## コミットと PR

- コミットは Conventional Commits 形式（`feat:` `fix:` `docs:` `chore:`）。
- ブランチ名は `feat/xxx`・`fix/xxx`・`docs/xxx` のように種別を先頭に付ける。
- 課題を解決する手順の設定は [.agents/issue-workflow.md](.agents/issue-workflow.md) にある（リポジトリの層だけ。ADR 0010）。

## Markdown

- `.markdownlint-cli2.jsonc` に従う（行長 `MD013` は無効）。編集したら `markdownlint-cli2` を通す。
