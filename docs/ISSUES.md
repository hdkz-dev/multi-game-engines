# 課題台帳 (2026-10-07)

## 2026-10-09再開時の状況

PR #269でM1a（通信境界）とQ1（公開APIテストの型安全化）は統合済み。mainのCodeQL警告・Dependabot警告は0件。PR #270は2026-10-09に統合済み（7391dbb）、core 0.2.2を含む45パッケージのnpm公開を全件確認。公開後CI・E2E・文書公開・SRI更新・Releaseもすべて成功。PR #272はUnicorn 77の設定互換性で失敗したため、ADR 061に従いUnicorn 64・Node 25型を維持し、minor/patch更新を検証する。Node型の解決版は25.9.9へ更新。メジャー更新はDependabotの通常グループから分離して個別に審査し、無視設定は追加しない。M1b（SRI必須化とキャッシュ完全性）・M1c（応答サイズ契約）は残件。

## 通信境界の修正 (2026-10-07)

main `2b6b534`でPR #268の依存修正は統合済み。監査0件、統合後CI・E2E・Release・文書公開・SRI更新は成功。今回M1aの通信境界を修正（統合待ち）：キャッシュ前にURLを検証し、HEAD・Range・GETはsafeFetch、credentials omit、redirect errorを使う。URL内資格情報・不正URL・外部HTTPをSECURITY_ERRORで拒否する。HEADのセキュリティ拒否・中断はfallbackしない。CodeQL 68–70の閉鎖は統合後に確認する。M1bのSRI必須化、M1cの応答サイズ契約、Q1は公開API経由のテストへ移行し、anyと抑制を除去済み（統合待ち）。Dependabot PR #267のaction-download-artifact v27更新も本変更に含める。

## 履歴: 10月7日11:51 JST、main 3febeb0の監査

mainは引き続き `3febeb0`。未処理PR・実行中/待機中Actionsは0件、最後のmain CIは成功。ただし新しいpnpm監査はCritical 1件・High 1件で失敗する。最新mainの過去CI成功を、現在の監査成功として扱わない。GitHub Dependabotは0件を返しており、監査の反映時点・データ差がある。

| ID  | 優先度 / 状態  | パッケージ・経路                                                                                         | 修正条件                                                                 | 完了条件                                                                  |
| --- | -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| S1  | 完了 / PR #268 | shell-quote 1.10.0、root→@changesets/cli→launch-editor。Critical、quoteの改行を利用するcommand injection | 1.11.0以上の修正版を親依存の許容範囲から解決。必要な制約変更は根拠を記録 | lockfile経路から脆弱版除去、release toolingの回帰、全監査・品質ゲート成功 |
| S2  | 完了 / PR #268 | sharp 0.35.4、React Dashboard→next→sharp、Wrangler→Miniflare→sharp。High、librsvgの脆弱性                | 0.35.5以上へ更新。Next更新を含める場合は既存パッチ・Node条件も確認       | Next build・画像処理の関連検証、脆弱版除去、全監査・品質ゲート成功        |

[S1 advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) / [S2 advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)。監査は依存版の該当を確認したもので、このプロジェクトでの実際の悪用は確認していない。CodeQL High 3件は別の解析で、合算せず区別して記録する。

実施順を **S1/S2 → M1a/M1bとM1c/Q1 → M2 → M3a → 前提が揃ったM4–M7** に更新。S1/S2は依存修正PRにまとめられるが、非セキュリティのメジャー移行を混在させない。S1/S2はPR #268で統合済み。Next経由とWrangler→Miniflare経由のsharpを、脆弱範囲限定の `sharp@<0.35.5: >=0.35.5 <0.36` で解決した。修正ブランチのpnpm auditは0件、lint・typecheck・build・test、Changesets status、sharpのSVG→PNG変換、Wrangler起動確認は成功。CodeQL High 3件とその他の課題は未解消。

## 確認基準と状態の定義

2026-10-07 11:51 JST、main `3febeb0` を基準に再確認。PR #266の24文書更新は統合済みで、マージ後の全CI・E2E・Release・Pages公開・SRI更新は成功。S1/S2の依存修正を併せて実施。M1以降の実装修正・認証更新は未実施。

「確認済み」はコード・設定・API応答に根拠がある状態。「未検証」は不具合と断定せず調査を必要とする状態。「保留」は互換性や外部前提が必要な状態。「完了」は対象の完了条件を満たした状態。CI成功・依存監査0件だけで全課題を完了にしない。

## 優先課題

| ID  | 分類 / 優先度  | 状態・根拠                                                     | 影響・次の作業                                                                                | 完了条件                                                             |
| --- | -------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| M1a | 完了 / PR #269 | mainのCodeQL警告0、URL事前検証と安全な全取得経路               | 回帰維持                                                                                      | 統合後CI成功                                                         |
| M1b | 確認済み / P0  | ChunkedDownloadOptions.sriは省略可能、全体検証は条件付き       | SRI必須原則と直接API契約の不一致。互換性・移行方法を決定                                      | 未検証データを成功として返さない契約、キャッシュ・分割検証も回帰確認 |
| M1c | 未検証 / P1    | HEAD失敗時にfallback、Rangeで200を許容、チャンク長でoffset更新 | 中断、空チャンク、不正Content-Length、過大/不一致応答、redirectを調査。現時点で実被害は未確認 | 応答契約を定義し、再現した不具合のみ根本修正してテスト               |
| Q1  | 完了 / PR #269 | 公開loadResourceのテストへ移行、any・lint抑制を除去            | 回帰維持                                                                                      | 型チェックと既存異常系成功                                           |
| M2  | 確認済み / P1  | outdated JSONは18種類、通常更新15・メジャー3                   | 通常更新の公開待機・peer・互換性を確認。wanted=currentだけで新規固定や障害と断定しない        | 採用分の全ゲート・E2E・OSV/npm監査0、保留理由を記録                  |
| M3a | 未検証 / P1    | NPM_TOKEN登録済み、最終更新7/31。現在の期限・権限は未確認      | Releaseは公開対象なしで成功。次回実公開前に秘密を表示せず認証確認                             | 有効期限・書込権限・対象パッケージ確認、必要な更新と公開結果の確認   |
| M3b | 完了 / P1      | PR #266で主要文書・README・方針・日英計画を整合                | 今回の台帳と参照更新を継続                                                                    | 文書同期、ローカルリンク、表記整合。M3aの完了とは別                  |
| M4  | 保留 / P2      | typescript-eslintはTS <6.1、TypeDocは6.0.xまで                 | TS 7.0.2はインストール済みツールのpeer範囲外。上流正式対応を再確認                            | 互換ツール採用後に型・宣言・API文書・全ゲート成功                    |
| M5  | 保留 / P2      | Unicorn 64、最新77。現対象はES2022                             | 規則差分・実行環境・要求APIを調査                                                             | 規則違反を抑制せず解消、対応環境で全ゲート成功                       |
| M6  | 保留 / P2      | Node型25.9.7、最新26.6.4。CIはNode 24                          | 型だけ先行させず対応実行環境を決定                                                            | 型と実行環境が整合、対象環境で検証成功                               |
| M7  | 保留 / P2      | root pnpm設定に15パッチ・10 overrides、readPackage hookあり    | 撤去時に脆弱依存・旧APIが再導入される可能性。上流ごとに確認                                   | 撤去後の凍結インストール、回帰、全監査0                              |

Q1は今回確認した1か所の課題であり、リポジトリ全体のany監査完了を意味しない。M1cはソース調査からの検証候補であり、確認済みの脆弱性件数には加算しない。

## M1の境界と設計判断

ChunkedDownloaderはcoreのindexから公開され、EngineLoaderでも利用される。EngineLoader.loadResourceは呼び出し前にvalidateResourceUrlを行うが、直接利用には適用されない。32 MiB以上かつSRIありのリソースはChunkedDownloaderへ委譲される。URLの初期検証とリダイレクト先の安全性も別々に検証する。

対象: [HEAD](../packages/core/src/storage/ChunkedDownloader.ts#L125)、[Range](../packages/core/src/storage/ChunkedDownloader.ts#L164)、[単一fetch](../packages/core/src/storage/ChunkedDownloader.ts#L216)。実装時に行番号を再確認する。警告: [68](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/68) / [69](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/69) / [70](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/70)。

設計判断はHTTPS、loopback開発URL（Portlessを含む）、URL資格情報、redirect、SRI未指定、セグメントハッシュ不足、キャッシュ再検証を対象にADRへ記録する。正常HTTPS、拒否時fetch未実行、改竄、Range契約、中断、進捗、キャッシュをテストする。警告のdismissや型・lint抑制で完了にしない。

## 将来機能・外部前提

| ID                | 現状                                                  | 着手前に必要なもの                                 | 完了条件                                                 |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| F1 KataGo         | スタブONNX配信・SRI登録済み、実モデルURL secret未登録 | 実モデル、ライセンス、入出力互換性、配信方針       | 実モデル推論・SRI・公開検証                              |
| F2 Mortal         | ルールベースWorker配信済み、実AI未統合                | モデル変換と推論Worker仕様                         | 実モデル動作・SRI・公開検証                              |
| F3 CDN            | Cloudflare設定・Workerコードあり、本番展開は未確認    | アカウント/R2/ドメイン、コスト・CORS・復旧手順     | 配信・SRI・障害時復旧確認                                |
| F4a 加速          | HardwareAccelerator診断とOTelは実装済み               | 実推論・探索の対象、対応GPU/NPU、性能基準          | 診断のみでなく実ワークロード・fallback・性能測定         |
| F4b Mobile        | NativeCommunicator基盤とモバイル製品統合を区別        | React Native/Capacitor、NDK/iOSの要件              | 実端末・ライフサイクル・配信検証                         |
| F5 Expert Mapping | MajorityVote/BestScore/固定Weightedとテストあり       | 序盤・終盤分類、専門性マッピング、決定論的評価方法 | 動的重み付けと回帰テスト。固定Weightedのみで完了にしない |

## 実施順序と保守上の制約

S1/S2の依存修正を先行し、M1a/M1bの仕様決定とM1cの再現確認を行い、同じセキュリティテスト範囲でQ1を解消する。その後M2。M3aは次回実公開の前提。M4–M7は上流・環境の条件が揃ったものから個別PRで実施し、将来機能は別計画へ分離する。

個人設定2件を保守PRへ混在させない。M7は現行パッチを一括撤去しない。今回の上流調査はインストール済みpeer設定までで、公開最新版の全互換調査は未完了。依存の最新値は日々変わるため着手時に再確認する。

[実行計画](implementation_plans/20261006-maintenance-and-roadmap.md) / [進捗](PROGRESS.md) / [English issue register](en/ISSUES.md)

## M1 / Q1の検証マトリクス

既存のChunkedDownloaderテストはキャッシュ、正常Range、進捗、fallback、SRI成功/不一致、HTTPエラー、保存、HEAD失敗、セグメント検証を含む。以下の「追加確認」は未実施の検証項目であり、テスト成功済みを意味しない。

| 境界                | 既存根拠                                            | 追加確認 / 合格条件                                                                                       |
| ------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 直接APIとLoader経由 | core export / EngineLoader委譲                      | 同じ安全方針。拒否入力はHEADを含めfetch開始前に例外                                                       |
| URLとredirect       | キャッシュ前URL検証、全取得でsafeFetch・omit/error  | loopback/Portless、資格情報、HTTPS→HTTP、相対URL、許可protocolを仕様化して検証                            |
| 完全性              | 正常SRI・不一致・不正形式・セグメント検証テストあり | SRI省略、複数hash、セグメント不足、キャッシュ読込後の検証を契約に合わせて確認                             |
| Range応答           | 正常チャンクとHTTP失敗テストあり                    | 200 fallback/206、Content-Range、空・超過チャンク、総サイズ不一致を再現し、無限進行・不正コピーがないこと |
| 中断・制限          | signal伝達、Loaderのtimeout指定あり                 | HEAD中・チャンク間・読込中の中断、長さ上限、chunkSize=0/負値/非整数を検証                                 |
| キャッシュと進捗    | get失敗fallback、保存、進捗テストあり               | 不正/改竄キャッシュ、保存失敗、例外時のcompleted通知、再試行の契約を検証                                  |
| エラーと型          | ChunkedDownloadError / EngineError、Q1のanyあり     | 公開APIで拒否を検証し、型安全性とエラー互換性を維持                                                       |

個別テストの意味があるものを採用し、実装をそのまま写すテストや環境時刻に依存するテストを増やさない。URLとSRIの契約を変える場合は破壊的変更の有無をADR・移行ガイド・changesetで判断する。

## M7のパッチ棚卸しと撤去条件

| 対象 / 数                               | 現在の役割                                                   | 関連設定                        | 撤去時の確認                                          |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------- |
| tsup 8.5.1 / 1                          | 宣言生成でbaseUrlを自動追加しない                            | パッチ                          | TypeScriptの宣言生成と全ビルドが上流のみで通る        |
| rapid-draughts 1.0.6 / 1                | .d.ts相対importの.js拡張子                                   | パッチ                          | NodeNext型解決とcheckers回帰                          |
| jest-dom 7.0.1 / 1                      | VitestのAssertion型・@vitest/expect拡張                      | パッチ                          | matcher型とUIテスト、宣言検査                         |
| nitropack 2.13.4 / 1                    | Archiver 8のZipArchive APIへ対応                             | nitropack>archiver override     | ZIP生成・Nuxtビルド。パッチとoverrideを一組で判断     |
| Storybook 10.6.1 / 5                    | React/Vue/Web ComponentsのCSF制約、react-vite型、ESM型import | 5パッチ                         | 全frameworkの宣言検査・Storybook生成・対象interaction |
| listhen 1.10.1 / 1                      | node-forgeを除去しNode crypto/x509へ移行                     | readPackage hook                | CJS/ESM HTTPS、CA・SAN・暗号PEM・PFXと監査            |
| Next ESLint 16.3.8 / 1                  | root discoveryをtinyglobbyへ移行                             | readPackage hook                | 相対/絶対/配列rootと過剰展開防止                      |
| fast-glob / globby / Parcel watcher / 3 | micromatch/bracesを安全なglob実装へ移行                      | 対象3種類のhook                 | glob/ignore/brace範囲・展開上限・watcherと監査        |
| Nuxt DevTools 3.4.2 / 1                 | simple-git 4の名前付きexportに対応                           | simple-git/argv-parser override | branch/revparse/statusとNuxt起動・ビルド              |

合計15パッチ。10 overridesの内訳は、安全下限（simple-git、argv-parser、source-map-js、minimatch、ajv、lodash、esbuild、sharp）の8件と、互換性調整（tsdoc utils、Nitro archiver）の2件。上流が修正版を採用していること、実際のlockfile経路、パッチなしの互換性を確認する。セキュリティ下限とバージョン上限の理由も再検証する。

## 公開準備の分割

M3bの文書整合はPR #266で完了したが、本台帳と詳細表は追加更新。M3aは「secretが存在」「認証が有効」「対象への書込権限がある」「公開対象がある」「公開後の利用確認」を別々に記録する。トークン再発行が必要かは期限・権限確認後に判断し、存在確認だけで更新不要としない。実公開を伴わない確認と外部書込みを分け、対象・版・復旧方法を具体化する。

## 文書の管理先と証拠の更新

| 情報                               | 管理先                               | 再確認のタイミング             |
| ---------------------------------- | ------------------------------------ | ------------------------------ |
| 課題ID、分類、根拠、影響、完了条件 | 本台帳・英語版                       | 調査/修正/上流対応で変化した時 |
| 順序、依存関係、PR完了条件         | 実行計画                             | 着手前と計画変更時             |
| HEAD・CI・PR・公開・警告           | PROGRESS                             | マージ後/公開後、日時付き      |
| 実装上の契約・設計                 | TECHNICAL_SPECS / ARCHITECTURE / ADR | コード変更時に日英同期         |
| 未完の機能と対象範囲               | ROADMAP / TASKS                      | 完了条件を満たした時           |

担当者・期限は未割当。M1の契約決定、M3aの認証情報、F1–F4の外部前提を確認してから割り当てる。計画作成を実装完了に、PRのCI成功を本番モデル完成に置き換えない。

## M2・M4–M6のバージョン別一覧

2026-10-07再取得。18種類（通常更新15、メジャー移行3）。wantedは解決結果であり採用判断とは別。Next/Next ESLintとNuxtの更新は既存のバージョン限定パッチ・hookへの影響も検証する。

| パッケージ                  | current      | wanted       | latest       | 依存元数 | 課題 |
| --------------------------- | ------------ | ------------ | ------------ | -------- | ---- |
| @eslint-react/eslint-plugin | 5.24.0       | 5.24.0       | 5.24.8       | 1        | M2   |
| @radix-ui/react-separator   | 1.1.15       | 1.1.15       | 1.1.16       | 1        | M2   |
| @typescript-eslint/parser   | 8.71.0       | 8.71.0       | 8.71.1       | 1        | M2   |
| @vitejs/plugin-react        | 6.1.1        | 6.1.1        | 6.1.2        | 4        | M2   |
| postcss                     | 8.5.28       | 8.5.28       | 8.5.29       | 1        | M2   |
| typescript-eslint           | 8.71.0       | 8.71.0       | 8.71.1       | 2        | M2   |
| vite                        | 8.3.2        | 8.3.2        | 8.3.3        | 9        | M2   |
| @cloudflare/workers-types   | 5.20261004.1 | 5.20261004.1 | 5.20261007.1 | 1        | M2   |
| @next/eslint-plugin-next    | 16.3.8       | 16.3.8       | 16.4.0       | 1        | M2   |
| @radix-ui/react-scroll-area | 1.2.18       | 1.2.18       | 1.3.0        | 1        | M2   |
| @radix-ui/react-slot        | 1.3.3        | 1.3.3        | 1.4.0        | 1        | M2   |
| next                        | 16.3.8       | 16.3.8       | 16.4.0       | 1        | M2   |
| nuxt                        | 4.5.2        | 4.5.2        | 4.6.0        | 1        | M2   |
| oxlint                      | 1.86.0       | 1.86.0       | 1.87.0       | 1        | M2   |
| wrangler                    | 4.147.0      | 4.147.0      | 4.148.0      | 1        | M2   |
| @types/node                 | 25.9.7       | 25.9.7       | 26.6.4       | 14       | M6   |
| eslint-plugin-unicorn       | 64.0.0       | 64.0.0       | 77.0.0       | 1        | M5   |
| typescript                  | 6.0.3        | 6.0.3        | 7.0.2        | 57       | M4   |

## M2 / M4–M6 残候補（2026-10-09、PR #272修正ブランチ）

11種類（通常8、メジャー3）。下表は採用済みの一覧ではなく次の更新候補。Nextのパッチ・hookとPlaywrightのブラウザー検証等を含め、個別の互換性検証が必要。

| Package                  | current | wanted  | latest  |
| ------------------------ | ------- | ------- | ------- |
| happy-dom                | 20.14.5 | 20.14.5 | 20.14.6 |
| vite                     | 8.3.2   | 8.3.2   | 8.3.4   |
| @lucide/vue              | 1.52.0  | 1.52.0  | 1.54.0  |
| @next/eslint-plugin-next | 16.3.8  | 16.3.8  | 16.4.0  |
| @playwright/test         | 1.63.0  | 1.63.0  | 1.64.0  |
| lucide-react             | 1.52.0  | 1.52.0  | 1.54.0  |
| next                     | 16.3.8  | 16.3.8  | 16.4.0  |
| wrangler                 | 4.147.0 | 4.147.0 | 4.149.0 |
| @types/node              | 25.9.9  | 25.9.9  | 26.6.4  |
| eslint-plugin-unicorn    | 64.0.0  | 64.0.0  | 77.0.0  |
| typescript               | 6.0.3   | 6.0.3   | 7.0.2   |
