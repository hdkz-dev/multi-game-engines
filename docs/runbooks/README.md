# Runbooks

外部認証情報・大規模変更が必要な手順をまとめた運用 runbook 群。各 runbook は「いつ・誰が・何をするか」を明確にした実行可能な手順書として書かれている。

## 一覧

| Runbook                                                  | 目的                             | ブロッカー                   | 想定工数   |
| -------------------------------------------------------- | -------------------------------- | ---------------------------- | ---------- |
| [katago-real-model.md](./katago-real-model.md)           | KataGo スタブ → 実モデル切替     | ONNX 変換済モデル URL の確保 | 5 分〜1 週 |
| [cdn-worker-deploy.md](./cdn-worker-deploy.md)           | Cloudflare Workers + R2 デプロイ | Cloudflare アカウント認証    | 半日〜1 日 |
| [mortal-onnx-conversion.md](./mortal-onnx-conversion.md) | Mortal PyTorch → ONNX 化         | AGPL 法務確認 + ML 環境      | 約 1 週間  |

## 共通方針

- **段階的切替**: 全エンジンを一度に切り替えない。Stockfish 1 つで動作検証してから他へ展開。
- **ロールバック手順**: 各 runbook に必ず記載。Secret 削除 + workflow 再実行で旧状態に戻せる設計。
- **検証チェックリスト**: 完了条件を明示。`pnpm test` / `gh pr checks` / 実 E2E まで。
- **コスト試算**: 月 100,000 リクエスト・10 GB ストレージまでは Cloudflare 無料枠。

## いつ着手すべきか

| Runbook         | トリガー                                         |
| --------------- | ------------------------------------------------ |
| KataGo 実モデル | Go の対局精度を上げたい / 公式モデル URL が確定  |
| cdn-worker      | GitHub Pages の帯域上限に到達 / 海外利用者が増加 |
| Mortal ONNX     | 麻雀の対局精度を上げたい / AGPL 法務 OK          |

**現状 (2026-05-10) はいずれも「即着手すべき」状態ではない**。GitHub Pages 配信 + スタブモデルで全機能稼働中、ユーザー需要が出てから対応で問題なし。

## 関連ドキュメント

- [TASKS.md](../TASKS.md) — 全体バックログ
- [PROGRESS.md](../PROGRESS.md) — 直近の変更ログ
- [ADR-014](../adr/) — バイナリ配布の物理分離方針
