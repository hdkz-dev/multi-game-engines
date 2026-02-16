# ADR-032: 2026年Q1最新技術スタック (Zenith Tier) への移行

## ステータス

承認済み (Accepted)

## コンテキスト

プロジェクトの継続的な品質向上と、将来の技術負債を最小化するため、2026年2月時点での最新安定版ライブラリおよび構成への移行を決定した。

## 決定事項

以下のスタックへのメジャーアップデートを実施する：

1. **フレームワーク**: Next.js 15.x から **Next.js 16.1.x** へのアップデート。
2. **型システム**: TypeScript 5.7.x から **TypeScript 5.9.x** へのアップデート。
3. **リンター**: **ESLint 9.20.0 (Flat Config)**。v10への先行移行を試みたが、エコシステム（eslint-config-next等）の追従待ちのため、現時点で最も安定かつ最新のv9系を選択。
4. **ランタイム最適化**: **React Compiler** の有効化。
5. **パッケージ管理**: pnpm 10.x の最新マイナーバージョンへの追従。
6. **構成の簡素化**: 重複していた `@storybook/eslint-config-storybook` を削除し、モダンな `eslint-plugin-storybook` + Flat Config 構成へ一本化。

## 理由

- **Next.js 16**: Turbopack の完全統合と、ESLint CLI への推奨移行パスによる開発体験の向上。
- **React Compiler**: 手動の `useMemo` / `useCallback` を不要にし、コンポーネントのレンダリングパフォーマンスを自動最適化。
- **ESLint 10**: 新機能とパフォーマンス向上の活用、および将来のルールセットへの対応。
- **TypeScript 5.9**: 最新の型推論機能とビルド速度の改善。

## 帰結

- 開発環境のビルド速度が向上。
- `Next.js` 16 移行に伴い、`next lint` から `eslint .` への CLI 移行を実施。
- `experimental.reactCompiler` からトップレベルの `reactCompiler` プロパティへの移行。
- 依存関係の脆弱性（計11件）が解消。
