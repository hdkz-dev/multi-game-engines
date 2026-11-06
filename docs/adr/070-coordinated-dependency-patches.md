# ADR 070: 依存ファミリーとバージョン別パッチの協調更新

- 日付: 2026-11-07
- 状態: 採用（検証・統合状態はPRで記録）

## 背景

Dependabotの広域minor/patchグループだけでは、候補ごとの解決時にVitest/coverageやStorybookのpeerが揃わず失敗する。またNuxt・Next・Tailwind・Storybook更新は旧版専用パッチを未使用にし、ERR_PNPM_UNUSED_PATCHで停止する。この拒否はパッチの目的を失わないための有効な検査である。

## 決定

依存ファミリーを同時に解決し、全patchedDependenciesとreadPackage hookをレビューする。上流に同等修正がある場合だけパッチを撤去し、まだ必要な変更は新しい配布物へ移植する。strictPeerDependencies、未使用パッチ拒否、24時間のminimumReleaseAgeを緩めない。TypeScript 7は関連ツールが対応するまで別の移行として保持する。

Nitro 2.13.6はarchiver 8のZipArchive APIを使用し、Parcel watcher 2.6.0はpicomatchを使用するため、その旧版パッチとwatcher専用hookを撤去する。Storybook 10.6.5の型制約とNext 16.4.5のtinyglobby移行は引き続きパッチする。glob/minimatchのセキュリティ更新は既存利用経路の回帰検証を必要とする。

回帰試験ではNitroの出力ZIP自身の混入を検出したため、2.13.6向けに出力ファイルを除外する独立パッチを追加する。Tailwindの旧watcher固定は2.6.0以降へ上書きする。minimatch 11で削除されたmakeReを使うimport-xルールは、パターン照合APIへ移植し許可・禁止双方を検証する。 TypeDocのディレクトリ探索も、削除されたmatchOneから公開match APIのpartial指定へ移行する。

```mermaid
flowchart LR
  A[更新候補と監査] --> B[依存ファミリーを同時解決]
  B --> C[上流実装とパッチの目的を比較]
  C --> D[不要パッチ撤去または移植]
  D --> E[厳格installと回帰検証]
  E --> F[CIと新しい監査]
```

## 検証と制限

frozen install、lint、typecheck、build、test、tooling契約、E2Eと監査を確認する。上流配信元にあるOSVの範囲問題は依存更新とは別の解決経路であり、除外しない。古いCI結果は現在の監査結果の代用にならない。
