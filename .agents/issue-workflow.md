---
format: 1
repo:
  check: node scripts/check-versions.mjs && npx --yes markdownlint-cli2@0.17.2 && claude plugin validate . --strict && claude plugin validate .claude-plugin/plugin.json --strict
  merge: merge
  review:
    by: claude
  deploy:
    type: auto
---

# 課題を解決する手順の設定

このプラグインのスキル `/resolve-issue`・`/resolve-issues` が、このリポジトリで作業するときに読む設定です。書式は [docs/issue-workflow-format.md](../docs/issue-workflow-format.md) にあります。

このリポジトリは公開されているので、リポジトリの層だけを書いています（[ADR 0010](../docs/adr/0010-repo-only-config-for-public-repositories.md)）。
プロジェクトの層は、このリポジトリを使うプロジェクトの正本にあります。`/resolve-issue` は、正本のリポジトリで始めてください。

## 確認

- スキルの手順を変えたときも、利用者に届けるために版を上げて CHANGELOG に書く。版を上げない変更は、すでに入れている利用者に届かない。

## 公開と確認

- main に入ると、マーケットプレイスから配られる。すでに入れている利用者に届くのは、版を上げたときだけである。
- 版を上げた変更は、マージのあとで、利用者がスキルを使うリポジトリ（`/resolve-issue` を始めた正本のリポジトリ）を作業ディレクトリにして、`claude plugin update issue-tracker@issue-tracker-plugin` を実行する。
  プラグインを `local`・`project` の範囲で入れていると、導入はディレクトリに結び付くので、ほかのディレクトリで実行すると別の導入を更新する。
  同じディレクトリで `claude plugin list` を実行し、issue-tracker の Version が新しい版であることと、導入先（`~/.claude/plugins/cache/issue-tracker-plugin/issue-tracker/<版>/`）の `skills/resolve-issue/SKILL.md` の「このスキルの版」を確かめる。
- スキルの動きは、新しいセッションで確かめるよう利用者に頼む。今のセッションには、古い版のスキルが読み込まれている。
- 版を上げない変更（文書だけの変更など）は、マージのあとで確かめることは無い。
