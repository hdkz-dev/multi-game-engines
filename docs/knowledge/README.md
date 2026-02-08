# ナレッジベース (Knowledge Base)

> 最終更新: 2026-02-06

このディレクトリには、プロジェクトの設計知識、技術的決定事項、ベストプラクティスを集約しています。

## 📚 ドキュメント一覧

| ファイル                                                 | 内容                                                |
| -------------------------------------------------------- | --------------------------------------------------- |
| [ARCHITECTURE_KNOWLEDGE.md](./ARCHITECTURE_KNOWLEDGE.md) | アーキテクチャと設計原則                            |
| [COMPONENT_DESIGN.md](./COMPONENT_DESIGN.md)             | コンポーネント設計詳細 (アダプターとブリッジの関係) |
| [RUNTIME_SUPPORT.md](./RUNTIME_SUPPORT.md)               | 実行環境サポート (Node.js/ブラウザ互換性)           |
| [SESSION_LOG.md](./SESSION_LOG.md)                       | 作業セッションログ                                  |
| [CHANGELOG.md](./CHANGELOG.md)                           | 変更履歴                                            |

## 🔗 関連ドキュメント

- [ARCHITECTURE.md](../ARCHITECTURE.md) - アーキテクチャ概要
- [DECISION_LOG.md](../DECISION_LOG.md) - 意思決定記録 (ADR)
- [TECHNICAL_SPECS.md](../TECHNICAL_SPECS.md) - 技術仕様書

## 📝 更新ガイドライン

### いつ更新するか

- 新しい設計パターンを導入したとき
- 技術的な決定を行ったとき
- ベストプラクティスを発見したとき
- 作業セッションの終了時

### 更新方法

1. 該当するファイルを開く
2. 適切なセクションに追記
3. 「最終更新」日付を更新
4. コミットメッセージに `docs: update knowledge base` を含める
