---
name: component-triad
description: 「実装・テスト・Storybook」の三位一体開発を強制・支援するスキル
---

# Component Triad Skill

このプロジェクトの "Strict Rule" である「[3 Big Requirements](../../CODING_CONVENTIONS.md#3-big-requirements)」を遵守するため、コンポーネント開発において「実装・テスト・Storybook」の 3 点セットを常に同時に扱うことを支援します。

## 主な機能

1.  **Triad Generation (三位一体生成)**
    - 新しいコンポーネントを作成する際、必ず以下の 3 つのファイルをセットで作成（または作成を提案）します。
      1.  `[Name].tsx` - コンポーネント実装
      2.  `__tests__/[Name].test.tsx` - ユニットテスト
      3.  `[Name].stories.tsx` - Storybook ストーリー
    - 既存のコンポーネントを修正する場合も、関連するテストとストーリーが存在するか確認し、なければ作成を促します。

2.  **Triad Verification (三位一体検証)**
    - コンポーネントを変更した後、そのコンポーネントに関連する検証のみをピンポイントで実行するコマンドを提案します。
    - コマンド例: `pnpm test components/path/to/__tests__/Component.test.tsx`

3.  **Missing Triad Check (欠落チェック)**
    - プロジェクト内をスキャンし、「`.tsx` はあるが `test` や `stories` がないコンポーネント」をリストアップします。
    - これは技術的負債の返済タスクを作成する際に役立ちます。
    - 実行方法: `pnpm run check:triad` または AI エージェントに「Triad Check を実行して」と依頼します。

## ファイルテンプレート（指針）

### テスト (`__tests__/*.test.tsx`)

- `@testing-library/react` を使用。
- `LanguageProvider` でラップしてレンダリングする（i18n 対応のため）。
- 主要な Props のバリエーションと、イベントハンドラの動作をテストする。
- `as any` は禁止。適切な型定義を使用する。

### Storybook (`*.stories.tsx`)

- `LanguageProvider` をデコレータとして含める。
- `Default` ストーリーに加え、`Loading`, `Error`, `Empty` など、主要な状態を網羅する。
- インタラクションテスト（`play` 関数）の使用を検討する。

## 使用例

- 「新しいボタンコンポーネントを作って」 → 3 点セットでコードを生成。
- 「このコンポーネントを修正して」 → テストとストーリーも同時に修正。
