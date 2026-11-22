# npm v12 セキュリティ適合・Trusted Publishing (OIDC) 移行実装計画

- 作成日: 2026-11-22
- 根拠 ADR: [ADR 072](../adr/072-npm-trusted-publishing-and-install-security.md)
- 対象基準: `main` (`8ce924b6`) / ローカル検証環境 `Node v24.13.0`, `npm 11.21.3`, `pnpm 12.15.0`
- 重要期限:
  - **2026-12-16**: 現行 GitHub Secret `NPM_TOKEN`（30日トークン）有効期限切れ
  - **2027-01 ごろ**: 2FA バイパス GAT による直接 `npm publish` 廃止予定（[公式発表](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)）

---

## 1. 事前監査サマリー

### 1-1. npm v12 インストール時セキュリティ監査（全 53 公開パッケージ）

| 項目                                                 | 監査結果     | 備考                                                                                     |
| :--------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------- |
| `preinstall` / `install` / `postinstall` / `prepare` | **0 件**     | 利用者側の npm v12 `allowScripts: off` でブロックされない                                |
| ネイティブアドオン (`binding.gyp`)                   | **0 件**     | 暗黙 `node-gyp rebuild` 対象なし                                                         |
| Git 依存 / リモート URL 依存                         | **0 件**     | `--allow-git=none` / `--allow-remote=none` 既定で支障なし                                |
| ワークスペース開発側の防御 (`pnpm-workspace.yaml`)   | **導入済み** | `allowBuilds`（8 件明示許可）・`minimumReleaseAge: 1440`・`strictPeerDependencies: true` |

### 1-2. `repository` メタデータ欠落パッケージ一覧（12 件 / 全 53 件中）

GitHub Actions からの OIDC Trusted Publishing・自動 Provenance 生成では、各 `package.json` の `repository.url` が `git+https://github.com/hdkz-dev/multi-game-engines.git` と一致している必要がある。現在以下 12 件で `repository` が欠落している（残り 41 件は設定済み・`directory` 一致確認済み）。

1. `@multi-game-engines/adapter-janggi` (`packages/adapter-janggi/package.json`)
2. `@multi-game-engines/adapter-xiangqi` (`packages/adapter-xiangqi/package.json`)
3. `@multi-game-engines/domain-gomoku` (`packages/domain-gomoku/package.json`)
4. `@multi-game-engines/domain-janggi` (`packages/domain-janggi/package.json`)
5. `@multi-game-engines/domain-xiangqi` (`packages/domain-xiangqi/package.json`)
6. `@multi-game-engines/i18n-chess` (`packages/i18n-chess/package.json`)
7. `@multi-game-engines/i18n-common` (`packages/i18n-common/package.json`)
8. `@multi-game-engines/i18n-core` (`packages/i18n-core/package.json`)
9. `@multi-game-engines/i18n-dashboard` (`packages/i18n-dashboard/package.json`)
10. `@multi-game-engines/i18n-engines` (`packages/i18n-engines/package.json`)
11. `@multi-game-engines/i18n-shogi` (`packages/i18n-shogi/package.json`)
12. `@multi-game-engines/registry` (`packages/registry/package.json`)

> 注: 公開 53 件中 51 件は `publishConfig.access` が未記載（`.changeset/config.json` の `"access": "public"` 経由で `--access public` が渡される構成）。Phase 0 で必要に応じ整合を確認する。

---

## 2. 段階的移行計画

### Phase 0: 事前コード・スクリプト・ワークフロー整備（2026-11-22 完了）

1. **12 パッケージへの `repository`・共通メタデータ補完（完了）**
   - 上記 12 パッケージの `package.json` へ `author`・`repository` (`directory: "packages/<dir>"`)・`bugs`・`homepage` を既存 41 件と同一形式で補完し、53/53 件の一致を確定。
2. **`scripts/setup-trusted-publishers.mjs` の改修（完了）**
   - npm CLI バージョン要件を **`11.15.0+`** に引き上げ。
   - `--mode=direct|stage|both`（既定 `direct` -> `--allow-publish`）・`--sleep-ms`（既定 `2000`ms）・`--filter` オプションと `--dry-run` 時ログイン不要プレビューを追加。
   - `isTrustEntryConfigured` で権限および失効状態を検査し、完了時に **48 時間（2 日）検証ルール** を明示表示するよう刷新（`lint:tooling` に組み込み）。
3. **旧 GAT 用ワークフロー整理・恒久テスト追加（完了）**
   - `.github/workflows/initial-publish.yml` を削除。
   - `scripts/initial-publish.mjs` / `scripts/sequential-publish.mjs` に新規登録用途限定・2FA バイパス GAT 廃止警告を追記。
   - `scripts/validation.test.mjs` に全 53 パッケージ OIDC メタデータ検証・npm v12 安全性検証・`setup-trusted-publishers.mjs` 検証の 3 テストを追加。

---

### Phase 1: OIDC Trusted Publishing 切替と 48 時間以内・全 53 パッケージ検証リリース（`2026-12-16 現 NPM_TOKEN 期限前`）

1. **Changeset 作成（全 53 公開パッケージ対象・12 パッケージの `repository` 修正と連携）**
   - 2026-10-02 の「未検証 Trusted Publishing 設定 48 時間自動失効」仕様により、設定だけして公開されないパッケージがあると 48 時間後に設定が失効する。
   - したがって **初回 OIDC 切替 PR には全 53 公開パッケージ分の `patch` changeset を含め、1 回のリリース実行で 53 件すべてを 48 時間以内に検証済み（恒久化）にする**。
   - 注: Phase 0 で `repository` 補完を入れた 12 パッケージ以外の残り 41 パッケージは README/メタデータ等の軽微整備または移行リリースノートの changeset 対象に含め、全 53 件に新パッチバージョンを払い出す。
2. **`.github/workflows/release.yml` の OIDC 専用化検証**
   - `actions/setup-node@v7` の設定と `changesets/action@v2` + `pnpm run release`（`pnpm build && changeset publish` → `@changesets/cli@3.0.3` が `pnpm publish` を実行）の組み合わせで、`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` が無い状態で OIDC トークン交換が確実に発火することを確認する。
   - ※ `actions/setup-node` が `.npmrc` へ `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` を書き出す挙動と `pnpm@12.15.0` の OIDC 自動検出の干渉（`E404` / `ENEEDAUTH`）を避けるため、空文字の `NODE_AUTH_TOKEN` を渡さない／必要に応じて `setup-node` の `registry-url` 設定有無や最小検証パッケージまたは `changeset publish` ログを慎重に確認する（`setup-node` が書き込んだ環境変数参照 `.npmrc` で `NODE_AUTH_TOKEN` 未設定時に pnpm 12 が OIDC へフォールバックするかを Phase 1 切替前に公開仕様・実リリースで確認し、必要なら `registry-url` を外して `NPM_CONFIG_REGISTRY` のみ渡す）。
   - ※ Phase 1 実行前に緊急ロールバック経路を残すため、`NPM_TOKEN` Secret 自体は **Phase 1 初回 OIDC 公開成功後（Phase 2）** まで GitHub に残し、`release.yml` 側の `env.NODE_AUTH_TOKEN` 行だけを削除した状態で実行する。
3. **リリース直前の OIDC Trust 一括設定（対話的 2FA 操作）**
   - ユーザーがローカルで `npm login` 実施後、`pnpm run npm:setup-oidc` を実行。
   - 1 件目のブラウザ 2FA 承認時に **npmjs.com の「Skip 2FA for 5 minutes」にチェック**を入れ、2 秒間隔 × 53 件（約 106 秒）で 5 分枠内に全 53 パッケージの設定を完了する。
4. **48 時間以内の本番リリース実行**
   - Release ワークフロー向け変更を `main` にマージ → Changesets が生成する `Version Packages` PR の内容（53 パッケージ一覧・changelog）をレビューして `--merge`（`--squash` 禁止）。
   - `Release` ワークフロー実行で全 53 パッケージが `NPM_TOKEN` 参照なし（OIDC + 自動 Provenance）で npm 公開されること、および npm 上の 53 パッケージすべてで Trusted Publisher が validated（48 時間期限解除）になったことを確認する。

---

### Phase 2: 静的トークン完全撤去とトークン公開禁止化（Phase 1 成功直後、遅くとも `2027-01 前`）

1. **全 53 パッケージの `Publishing access` 強化**
   - npmjs.com 各パッケージの Settings → Publishing access で **`Require two-factor authentication and disallow tokens`** を有効化（Organization / CLI バッチ管理可否を確認しつつ全 53 件に適用）。
2. **`NPM_TOKEN` 削除・GAT 失効**
   - `gh secret delete NPM_TOKEN --repo hdkz-dev/multi-game-engines` で GitHub Actions Secret を削除。
   - npmjs.com Account → Access Tokens から該当 2FA バイパス GAT を Revoke。
3. **ドキュメント最終化**
   - ADR 072 の状態を `採用（承認・移行完了）` へ更新し、`TASKS.md` / `PROGRESS.md` / `ISSUES.md` (M8) を完了クローズする。

---

## 3. リスク・ロールバック方針

| リスク                                                                                                | 対策 / ロールバック                                                                                                                                                                                  |
| :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OIDC 設定後 48 時間以内にリリースが通らず設定が失効する                                               | 設定はリリース PR マージ直前に実行する。失効した場合は期限切れ設定を `npm trust revoke` で削除し再登録すれば新しい 48 時間枠を開始可能                                                               |
| `setup-node` が生成する `.npmrc` と `pnpm publish` の OIDC 自動検出が衝突 (`E404` / `ENEEDAUTH`) する | `release.yml` の `env` から `NODE_AUTH_TOKEN` を外したうえで、必要なら `setup-node` の `registry-url` を外し `npm_config_registry: https://registry.npmjs.org`（または `pnpm` デフォルト）を使用する |
| 53 件連続設定中に 5 分間の 2FA スキップ枠が切れる                                                     | 53 件 × 2 秒 = 106 秒のため 300 秒以内に完了するが、万一途中中断しても `setup-trusted-publishers.mjs` の `isAlreadyConfigured` により未設定パッケージだけ再開できる                                  |
| Phase 1 初回 OIDC 公開で未想定エラーが発生し急ぎのパッチ公開が必要になった場合                        | Phase 2 までパッケージ設定「disallow tokens」を有効化せず、かつ有効期限内の GAT があれば一時的に切り戻し可能（2026-12-16 まで）                                                                      |
