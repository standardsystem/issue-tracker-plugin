# issue-tracker-plugin

STANDARD Issue Tracker の課題を、Claude Code が着手から完了まで解決するためのプラグインです。

## スキル

- `/issue-tracker:resolve-issue <課題キー>`: 課題を1件解決する。
  着手の確認 → 着手 → 実装と確認 → PR → レビューと対応（最大3回） → マージ → 公開 → 本番で確認 → 完了、の順に進め、段階ごとに課題へコメントを残す。
  公開の前には、毎回利用者の承認を求める。マージは、レビューで止まる条件を満たし、レビューのあとの push が修正だけで、CI が成功し（CI が無ければ `check` を通し）、マージで公開されず、`## 毎回確かめること` に当たらず、PR が設定のファイルを変えていないときだけ、承認なしで行う（[ADR 0003](docs/adr/0003-review-gated-merge.md)、[ADR 0013](docs/adr/0013-read-settings-from-default-branch.md)）。
  プロジェクトの設定で「API キーではこの状態にできない」を付けた状態には、スキルは課題を変えず、画面で変えるよう利用者に頼む（[ADR 0007](docs/adr/0007-api-locked-statuses.md)）。
  ほかに同じ名前のスキルが無ければ、`/resolve-issue` でも呼べます。「PROJ-12 を解決して」のように頼んでも使われます。
- `/issue-tracker:resolve-issues [課題キー…]`: 複数の課題を、`resolve-issue` の手順で1件ずつ解決する。
  承認や利用者の判断が要るところに来た課題は、そこで止めて次の課題へ進み、最後に承認と判断をまとめて求める。

## 使うために要るもの

- Claude Code
- STANDARD Issue Tracker の API キー（画面の「API キー / MCP」で発行する）
- GitHub CLI（`gh`）。PR の作成、マージ、設定の正本の読み込みに使う
- レビューを Codex にさせる場合は、Codex CLI。スキルは、着手の前に `codex` が使えることと、Codex に送ってよい範囲を確かめる（[ADR 0008](docs/adr/0008-check-review-config-before-starting.md)）

## 入れ方

### 1. MCP サーバーを設定する

課題を解決するリポジトリごとに、`.mcp.json` に MCP サーバー `issue-tracker` を設定します。
API キーは、そのプロジェクトだけを操作できるように範囲を絞って発行することを勧めます。

```json
{
  "mcpServers": {
    "issue-tracker": {
      "type": "http",
      "url": "https://<Issue Tracker のオリジン>/api/mcp",
      "headers": {
        "Authorization": "Bearer <API キー>"
      }
    }
  }
}
```

> [!IMPORTANT]
> API キーを書いた `.mcp.json` を Git に入れないでください。`.gitignore` に `.mcp.json` を足してください。
> キーは発行した人と同じ権限で動くので、リポジトリを読める人がその人として操作できてしまいます。

リポジトリがすでに `.mcp.json` を Git で管理している（ほかの MCP サーバーをチームで共有しているなど）ときは、そこにキーを書かないでください。
`.gitignore` に足しても、管理しているファイルは外れません。代わりに、リポジトリの外に保存される設定を使います。

```bash
claude mcp add --transport http --scope local issue-tracker https://<Issue Tracker のオリジン>/api/mcp \
  --header "Authorization: Bearer <API キー>"
```

このコマンドは、キーがシェルの履歴に残ります。打ったあとで履歴から消してください。キーを Claude との会話に貼らないでください。

キーを環境変数から読む（`"Bearer ${変数名}"`）場合は、プロジェクトごとに別の変数名にしてください。
どのリポジトリでも同じ変数を使うと、すべてのプロジェクトで同じキーを使うことになります。

プラグインは MCP サーバーの設定を含みません（[ADR 0002](docs/adr/0002-no-bundled-mcp-server.md)）。

### 2. プラグインを入れる

Claude Code で次を実行します。

```text
/plugin marketplace add standardsystem/issue-tracker-plugin
/plugin install issue-tracker@issue-tracker-plugin
```

`/plugin` が使えない環境（VS Code 拡張など。「/plugin isn't available in this environment」と出る）では、ターミナルで次を実行してから、新しいセッションを開きます。
`--scope` を付けなければ `user`（すべてのディレクトリ）に入ります。1つのリポジトリだけで使うなら、そのリポジトリのディレクトリで、`claude plugin install` に `--scope local` を付けて実行します。

```bash
claude plugin marketplace add standardsystem/issue-tracker-plugin
claude plugin install issue-tracker@issue-tracker-plugin
```

### 3. 更新を受け取る

常に最新版を使う前提です。自動更新は、Claude Code の既定では切れています。
`/plugin` の Marketplaces で `issue-tracker-plugin` を選び、自動更新を有効にしてください。

手で更新するときは、次を実行してから `/reload-plugins` で読み込み直します。

```text
/plugin marketplace update issue-tracker-plugin
```

`/plugin` が使えない環境（VS Code 拡張など）では、ターミナルで次を実行してから、`/reload-plugins` で読み込み直します。`/reload-plugins` も使えなければ、新しいセッションを開きます。開いているセッションは、古い版のスキルを読んだままです。

```bash
claude plugin marketplace update issue-tracker-plugin
claude plugin update issue-tracker@issue-tracker-plugin
claude plugin list
```

- `claude plugin update` には、プラグインの名前（`issue-tracker@issue-tracker-plugin`）が要ります。
- `local`・`project` の範囲で入れたときは、スキルを使うリポジトリのディレクトリで実行します。`--scope` を付けなければ、そのディレクトリに結び付いた導入を探して更新します。ほかのディレクトリで実行すると、別のリポジトリの導入を更新することがあります。
- 最後の `claude plugin list` で、新しい版になったことを確かめます。複数のディレクトリに入れていると、普通の出力は、ほかのディレクトリの導入も区別なく並べます。そのときは `claude plugin list --json` で、`projectPath` が今のディレクトリの導入の `version` を見ます。

Issue Tracker のサーバーが、より新しい版を求めているとき、スキルは更新を勧めます。

### 4. リポジトリに設定のファイルを置く

課題を解決するリポジトリに `.agents/issue-workflow.md` を置き、`AGENTS.md` にそれを指す1行を足します。
書き方は [設定のファイルの書式](docs/issue-workflow-format.md) にあります。
ファイルが無いリポジトリでスキルを使うと、スキルが案を作って、書くかを聞きます。
設定は、既定のブランチに入ると効きます。既定のブランチの作業ツリーで書いたものは、コミットの前でも読まれます（書式の文書の「設定のファイルを読む場所」）。

### チームで使う

リポジトリの `.claude/settings.json` にマーケットプレイスとプラグインを書いておくと、チームの人がそのリポジトリを信頼したときに使えるようになります。
次のコマンドで書き込み、`.claude/settings.json` をコミットしてください。

```bash
claude plugin marketplace add standardsystem/issue-tracker-plugin --scope project
claude plugin install issue-tracker@issue-tracker-plugin --scope project
```

> [!NOTE]
> `--scope project` で入れた記録は、コマンドを実行したディレクトリに結び付きます。
> コマンドは、スキルを使うリポジトリのディレクトリで実行してください。PR を作るための別の作業ツリー（`git worktree`）で実行すると、元のディレクトリでは読み込まれません。
> 別の clone や作業ツリーで、`claude plugin list` に出るのにスキルが使えないときは、そのディレクトリで上の2つのコマンドを実行し直し、`/reload-plugins` で読み込み直してください。

## 文書

- [設定のファイルの書式](docs/issue-workflow-format.md)
- [課題に残すコメントの印](docs/comment-markers.md)
- [CHANGELOG](CHANGELOG.md)
- [ADR 0001: プラグインとして配り、プロジェクトの違いは設定のファイルに書く](docs/adr/0001-plugin-and-project-config.md)
- [ADR 0002: MCP サーバーの接続の設定をプラグインに含めない](docs/adr/0002-no-bundled-mcp-server.md)
- [ADR 0003: レビューで止まる条件を満たした PR は承認なしでマージし、まとめて任せる仕組みは作らない](docs/adr/0003-review-gated-merge.md)
- [ADR 0004: 正本の Markdown の節は、`## レビュー` だけを受け継ぐ](docs/adr/0004-inherit-review-section.md)
- [ADR 0005: レビューする Claude のモデルを設定で選び、複数のレビューする者を並べられるようにする](docs/adr/0005-review-model-and-multiple-reviewers.md)
- [ADR 0006: 作業している間だけ課題を予約し、止めるときは解除する](docs/adr/0006-reserve-issue-while-working.md)
- [ADR 0007: API キーでは変えられない状態への変更は、利用者に画面で変えてもらう](docs/adr/0007-api-locked-statuses.md)
- [ADR 0008: レビューの設定は着手の前に確かめ、Codex に送ってよい範囲が分からなければ利用者に確かめる](docs/adr/0008-check-review-config-before-starting.md)
- [ADR 0009: レビューの設定の確かめは、当たったものをまとめて示し、送ってよいという答えを `着手` の印に残す](docs/adr/0009-show-all-review-config-problems-at-once.md)
- [ADR 0010: 公開のリポジトリには、リポジトリの層だけの設定を置き、正本からたどる](docs/adr/0010-repo-only-config-for-public-repositories.md)
- [ADR 0011: このリポジトリのブランチ名・コミット・PR には、課題キーだけを書いてよい](docs/adr/0011-issue-keys-in-branches-commits-and-prs.md)
- [ADR 0012: PR がレビューのスクリプトを変えたときは、差分を示して、Codex に送ってよいかを利用者に確かめる](docs/adr/0012-ask-when-pr-changes-review-script.md)
- [ADR 0013: 手元のリポジトリの設定のファイルは、既定のブランチのものを読む](docs/adr/0013-read-settings-from-default-branch.md)

## ライセンス

[MIT](LICENSE)
