# issue-tracker-plugin

STANDARD Issue Tracker の課題を、Claude Code が着手から完了まで解決するためのプラグインです。

> [!NOTE]
> 今は仕様を決めている段階です。スキルはまだ入っていません。

## 入れる予定のスキル

- `/resolve-issue <課題キー>`: 課題を1件解決する。
  着手の確認 → 着手 → 実装と確認 → PR → レビューと対応（最大3回） → マージ → 公開 → 本番で確認 → 完了、の順に進め、段階ごとに課題へコメントを残す。
- `/resolve-issues [課題キー…]`: 複数の課題を、`/resolve-issue` の手順で1件ずつ解決する。
  最初に対象とマージ・公開の任せ方をまとめて決め、止まった課題は残して次へ進み、最後に結果を表でまとめる。

## 使うために要るもの

- Claude Code
- STANDARD Issue Tracker の API キー（画面の「API キー / MCP」で発行する）
- GitHub CLI（`gh`）。PR の作成、マージ、設定の正本の読み込みに使う

## 使い方の流れ（予定）

1. 環境変数 `ISSUE_TRACKER_URL`（Issue Tracker の画面のオリジン）と `ISSUE_TRACKER_API_KEY` を設定する。
2. このリポジトリをマーケットプレイスとして追加し、プラグインを入れる。
3. 課題を解決するリポジトリに、設定のファイル `.agents/issue-workflow.md` を置く（[書式](docs/issue-workflow-format.md)）。
4. そのリポジトリの `AGENTS.md` に、設定のファイルを指す1行を足す。

## 文書

- [設定のファイルの書式](docs/issue-workflow-format.md)
- [課題に残すコメントの印](docs/comment-markers.md)
- [ADR 0001: プラグインとして配り、プロジェクトの違いは設定のファイルに書く](docs/adr/0001-plugin-and-project-config.md)

## ライセンス

[MIT](LICENSE)
