# ADR-028: Storybook 10 への移行と ESM 専用構成の採用

## ステータス

承認済み (Accepted)

## コンテキスト

Storybook 10 は、パフォーマンスの向上と最新の Web 標準への準拠を目指し、ESM 専用 (ESM-only) のアーキテクチャへと移行しました。本プロジェクトの UI パッケージ群 (`ui-react`, `ui-vue`, `ui-elements`) においても、保守性と開発体験を向上させるため、Storybook 10 へのアップグレードが必要です。

## 意思決定

1.  **Storybook 10.2.8 へのアップグレード**: 全ての UI パッケージで Storybook 10 を採用し、Vite 6 および Tailwind CSS v4 との統合を図ります。
2.  **ESM 専用設定の導入**: `.storybook/main.ts` において、`createRequire` の代わりに `import.meta.resolve` を使用した ESM 準拠のパス解決を導入します。
3.  **アドオンの整理**: 廃止された `addon-essentials` を個別の軽量なアドオン（`addon-links`, `addon-docs`, `addon-a11y` 等）に分解し、パッケージサイズと起動時間を最適化します。
4.  **互換フォークの採用**: 公式の `storybook-dark-mode` が SB10 に未対応であるため、コミュニティで維持されている `@vueless/storybook-dark-mode` を採用します。

## 影響

- **メリット**: ビルド速度の向上、最新の CSS 規格 (Tailwind v4) との完全な互換性、ESM による堅牢なモジュール解決。
- **デメリット**: 既存のアドオンの一部が利用できなくなる可能性がある（コミュニティフォークでの対応が必要）。
