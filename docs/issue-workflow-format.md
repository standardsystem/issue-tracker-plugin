# 設定のファイル `.agents/issue-workflow.md` の書式（書式 1）

スキル `/resolve-issue` と `/resolve-issues` は、課題を解決する手順のうち、プロジェクトやリポジトリによって違うことを、このファイルから読みます。
各リポジトリの `.agents/issue-workflow.md` に置いてください。

## 考え方

- 1つのファイルを、**前半の YAML（スキルが分岐に使う値）** と **後半の Markdown（手順や注意の文章）** に分けます。
- 設定は2つの層に分けます。
  - **プロジェクトの層**（`project`）: プロジェクトキー、状態の対応、カテゴリーとリポジトリの対応。プロジェクトに1か所だけ書きます。
  - **リポジトリの層**（`repo`）: 確認のコマンド、マージの方法、レビュー、公開。リポジトリごとに書きます。
- 1つのリポジトリだけのプロジェクトでは、両方を同じファイルに書きます。
- 複数のリポジトリにまたがるプロジェクトでは、正本のリポジトリにプロジェクトの層を書きます。
  ほかのリポジトリには、`project.definedIn` で正本の場所を書き、リポジトリの層のうち正本の既定値と違うところだけを書きます。
- キーは英語です（スキルやスクリプトが読むため）。状態の名前などの値は、Issue Tracker の表記のまま書きます。
- 作業するリポジトリの `AGENTS.md`（無ければ `CLAUDE.md`）に書いてあることは、ここに繰り返さないでください。スキルはそちらも読みます。

## `AGENTS.md` に置く1行

`AGENTS.md` を短く保つため、本文はこのファイルに書き、`AGENTS.md` には参照だけを置きます。

```markdown
- 課題を解決する手順の設定は [.agents/issue-workflow.md](.agents/issue-workflow.md) にある。
```

## YAML の項目

```yaml
format: 1                      # 書式の番号（必須）

project:
  key: PROJ                    # プロジェクトキー（必須）
  definedIn: owner/repo        # プロジェクトの層をほかのリポジトリに書いたとき、その場所。書いたら下の3つは書かない
  statuses:                    # 状態の役割と名前の対応
    inProgress: 処理中          # 必須
    merged: 処理済み            # 省略可。無ければ「処理中」のままコメントで区別する
    done: 完了                  # 省略可。省略すると、完了扱いの状態が1つだけならそれを使う
  repositories:                # カテゴリーとリポジトリの対応。1つのリポジトリだけのプロジェクトでは省略する
    <カテゴリー名>: owner/repo
  defaults:                    # 省略可。リポジトリの層の既定値（repo と同じ形）

repo:
  category: web                # このリポジトリのカテゴリー。repositories があるときは必須
  check: make lint test        # PR を出す前に必ず通すコマンド（必須）
  merge: merge                 # merge | squash | rebase（必須）
  review:
    by: claude                 # claude | codex | none（省略すると claude）
  deploy:
    type: manual               # none | auto | manual | release | external
```

### `project.statuses`

課題の状態を、手順の中の役割に対応させます。

| 役割 | 意味 | 省略したとき |
| --- | --- | --- |
| `inProgress` | 着手した | 省略できない |
| `merged` | main に入ったが、公開か本番での確認がまだ | 「処理中」のままにし、コメントの印（`確認待ち`・`リリース待ち`）で区別する |
| `done` | 本番で確かめた | 完了扱いの状態が1つだけなら、それを使う。2つ以上あれば止めて利用者に聞く |

### `repo.review.by`

| 値 | レビューする者 |
| --- | --- |
| `claude` | Claude の別のエージェント（既定） |
| `codex` | Codex。呼び方・版・送ってよい範囲は、Markdown の `## レビュー` に書く |
| `none` | レビューしない |

どれでも、重大度（P0〜P3）、指摘の仕分け、止まる条件、最大3回は同じです。3回を超えるのは、止まったあとで利用者がもう1回を選んだときだけです。

### `repo.deploy.type`

| 値 | 公開の仕方 | マージのあと | 「完了」にできるとき |
| --- | --- | --- | --- |
| `none` | 公開しない（ライブラリ、文書など） | 何もしない | マージしたとき |
| `auto` | main に入ると自動で公開される | 公開の処理が終わるのを待つ | 本番で確かめたとき |
| `manual` | コマンドで公開する | 利用者の指示を受けて、きれいな作業ツリーから公開する | 本番で確かめたとき |
| `release` | 版を切ってまとめて出す | `リリース待ち` で止める（リリースを出すことは扱わない） | 次のリリースのあと、確かめたとき |
| `external` | 外部の審査を経る（アプリストアなど） | `確認待ち` で止める | 審査を通り、確かめたとき |
| （省略） | 分からない | — （着手の前に利用者に聞き、この項目を書くことを提案する） | — |

スキルは、公開の直前に、毎回利用者の承認を受けます。
マージは、レビューで止まる条件を満たし、レビューのあとに修正のほかの push が無く、CI が成功し（CI のチェックが無いリポジトリでは、マージする head で `check` を通し）、マージで公開されず、`## 毎回確かめること` に当たらないときだけ、承認を受けずに行います。
`auto` では、マージで公開されるので、マージの直前に毎回承認を受けます。マージの承認が公開の承認を兼ねることを、明示して聞きます。
省略したときと、表に無い値を書いたときは、着手の前に利用者に聞き、その答えを型として使います。答えが `auto` か、利用者にも分からなければ、マージの直前に毎回承認を受けます。

## Markdown の見出し

どれも省略できます。`## 公開と確認` が無いのに、公開の手順や本番での確かめ方が要るときは、スキルが利用者に聞きます。

| 見出し | 書くこと |
| --- | --- |
| `## 確認` | `check` のほかに、変更の種類に応じてすること（画面の変更なら起動して見る、DB の変更なら統合テストも通す、など） |
| `## レビュー` | `codex` のときの呼び方・版・送ってよい範囲。指摘しなくてよい、意図した書き方 |
| `## 公開と確認` | 公開の手順、待ち方、本番での確かめ方、自分では確かめられないもの |
| `## 毎回確かめること` | 公開のほかに、その操作の直前に利用者に確かめる操作（箇条書き）。マージを毎回確かめたいときは「すべてのマージ」と書く。スキルは、作業するリポジトリのものと、`definedIn` の正本のものの両方を見る |
| `## そのほか` | 上に当てはまらない注意 |

## スキルの読み方

1. 作業を始めたリポジトリの `.agents/issue-workflow.md` を読む。
2. `project.definedIn` があれば、正本のファイルを `gh api repos/<owner/repo>/contents/.agents/issue-workflow.md` で GitHub から読む。
   手元の clone の場所に左右されないためである。読むのは既定のブランチの最新。
3. 課題のカテゴリーから、`project.repositories` で作業するリポジトリを決める。
   - 今のリポジトリと同じなら、そのまま作業する。
   - 違えば、隣のフォルダー（`../<リポジトリ名>`）を探し、remote が `owner/repo` と一致すれば使う。
   - 見つからなければ、利用者に場所を聞く。
4. 作業するリポジトリの `.agents/issue-workflow.md` を読み、`repo` の値を決める。
   優先は、そのリポジトリの `repo` → 正本の `project.defaults` → スキルの既定値。
5. `format` がスキルの知らない番号なら、止めて利用者に伝える。古い番号なら、書き換えを提案する。
6. ファイルが無ければ、Issue Tracker の状態の一覧などから案を作り、ファイルを書くことを提案する。

---

## 例 1: 1つのリポジトリ、自動で公開

`acme/tasks-web`。main に入ると GitHub Actions が公開します。

````markdown
---
format: 1
project:
  key: TASKS
  statuses:
    inProgress: 処理中
    merged: 処理済み
    done: 完了
repo:
  check: npm run lint && npm test
  merge: squash
  deploy:
    type: auto
---

## 確認

- DB に関わる変更は、`npm run test:integration` も通す（テスト用の DB を起動するので重い）。
- 画面に関わる変更は、`npm run dev` で起動して動きを確かめる。

## 公開と確認

- main に入ると、`deploy.yml` が自動で動く。マージしたコミットの実行を `gh run list --workflow deploy.yml` で探し、終わるのを待つ。
- 本番の画面で、変更した機能が動くことを確かめる。ログインが要る操作は、利用者に頼む。

## 毎回確かめること

- マイグレーションを含む変更のマージ（マージ＝公開で、本番の DB に当たるため）
- クラウドの資源を足すか変えること
````

## 例 2: 複数のリポジトリの正本、手動で公開

`acme/shop-portal`。プロジェクト `SHOP` の正本です。

````markdown
---
format: 1
project:
  key: SHOP
  statuses:
    inProgress: 対応中
    done: 完了
  repositories:
    portal: acme/shop-portal
    api: acme/shop-api
    importer: acme/shop-importer
  defaults:
    check: make lint test
    merge: merge
    deploy:
      type: release
repo:
  category: portal
  deploy:
    type: manual
---

## 確認

- 画面に関わる変更は、`make preview` で動きを確かめる。

## 公開と確認

- `make deploy` で公開する。最新の origin/main を、きれいな作業ツリーに取り出して行う。
- 公開したファイルが新しい版と一致し、ページが返ることを確かめる。

## 毎回確かめること

- `make deploy-rules`（データベースのルールは全体で1つのため）
- 利用規約などの法務の文面を変えること
- 依存を足すこと

## そのほか

- カテゴリーはリポジトリごとに1つ。複数のリポジトリにまたがる課題は、作業の中心になるリポジトリのカテゴリーにする。
````

このプロジェクトには「処理済み」に当たる状態がありません。そのため、`merged` を書いていません。
マージしたあと公開か確認を待つ課題は「対応中」のまま、コメントの印で区別します。

## 例 3: 正本がほかにあるリポジトリ、レビューは Codex

`acme/shop-importer`。他社から使用の許諾を受けたデータを含みます。

````markdown
---
format: 1
project:
  key: SHOP
  definedIn: acme/shop-portal
repo:
  category: importer
  review:
    by: codex
---

## レビュー

- Codex には、必ず `tools/codex-review.sh` を通して送る。許諾を受けたデータ（`vendor-data/`）を外部に送らないため。
- Codex の版は `mise.toml` で決めてある。
- 送る範囲（`tools/codex-review.sh` の `INCLUDE`）を広げるときは、利用者に確かめる。
````

`check`・`merge`・`deploy` は、正本の `defaults` から受け継ぎます。
