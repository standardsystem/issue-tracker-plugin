# AGENTS.md

STANDARD Issue Tracker 用の Claude Code プラグインのリポジトリです。設計の判断は `docs/adr/` にあります。

## 必ず守ること

- **このリポジトリは公開されている。** Issue Tracker の接続先の URL、社内のプロジェクト名・プロジェクトキー・リポジトリ名、取引先や作品の事情を書かない。例は `acme/...` のような架空の名前で書く。
- API キーなどの秘密情報を書かない。接続先と API キーは環境変数（`ISSUE_TRACKER_URL`・`ISSUE_TRACKER_API_KEY`）から読む。
- 設定のファイルの書式（`docs/issue-workflow-format.md`）やコメントの印（`docs/comment-markers.md`）を変えたら、版を上げて CHANGELOG に書く。書式を壊す変更では、`format` の番号を上げる。
- `main` へ直接プッシュしない。ブランチを切って PR を出す。

## コミットと PR

- コミットは Conventional Commits 形式（`feat:` `fix:` `docs:` `chore:`）。
- ブランチ名は `feat/xxx`・`fix/xxx`・`docs/xxx` のように種別を先頭に付ける。

## Markdown

- `.markdownlint-cli2.jsonc` に従う（行長 `MD013` は無効）。編集したら `markdownlint-cli2` を通す。
