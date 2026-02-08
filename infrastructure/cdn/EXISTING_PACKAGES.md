# 既存 Stockfish WASM パッケージ調査

> 調査日: 2026-02-06

## ⚖️ ライセンス・初版日一覧

| パッケージ                   | ライセンス      | 初版日  | 最新版 | 備考                    |
| ---------------------------- | --------------- | ------- | ------ | ----------------------- |
| `stockfish`                  | **GPL-3.0**     | 2014-10 | 17.1.0 | Chess.com 協力、✅ 推奨 |
| `stockfish.wasm`             | **GPL-3.0**     | 2018-11 | 0.10.0 | Lichess 公式            |
| `stockfish.js`               | **GPL-3.0**     | 2018-07 | 10.0.2 | 非推奨 (レガシー)       |
| `stockfish-mv.wasm`          | **GPL-3.0**     | 2019-02 | 0.6.1  | マルチバリアント        |
| `stockfish-nnue.wasm`        | **GPL-3.0**     | 2020-11 | 1.0.0  | NNUE 専用ビルド         |
| `@lichess-org/stockfish-web` | **AGPL-3.0** ⚠️ | 2025-04 | 0.2.1  | Lichess 最新版          |
| `lila-stockfish-web`         | **AGPL-3.0** ⚠️ | 2021-06 | -      | Lichess 内部用          |

> ⚠️ **AGPL-3.0** はネットワーク経由でサービスを提供する場合もソースコード公開義務が発生します。

---

## 📊 ダウンロード数サマリー (週間)

| パッケージ                   | 週間DL    | ライセンス | npm                                                             | jsDelivr                                                                    |
| ---------------------------- | --------- | ---------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `stockfish`                  | **7,883** | GPL-3.0    | [npm](https://www.npmjs.com/package/stockfish)                  | [jsDelivr](https://www.jsdelivr.com/package/npm/stockfish)                  |
| `stockfish.js`               | 1,477     | GPL-3.0    | [npm](https://www.npmjs.com/package/stockfish.js)               | [jsDelivr](https://www.jsdelivr.com/package/npm/stockfish.js)               |
| `stockfish.wasm`             | 942       | GPL-3.0    | [npm](https://www.npmjs.com/package/stockfish.wasm)             | [jsDelivr](https://www.jsdelivr.com/package/npm/stockfish.wasm)             |
| `@lichess-org/stockfish-web` | 730       | AGPL-3.0   | [npm](https://www.npmjs.com/package/@lichess-org/stockfish-web) | [jsDelivr](https://www.jsdelivr.com/package/npm/@lichess-org/stockfish-web) |
| `stockfish-mv.wasm`          | 484       | GPL-3.0    | [npm](https://www.npmjs.com/package/stockfish-mv.wasm)          | [jsDelivr](https://www.jsdelivr.com/package/npm/stockfish-mv.wasm)          |
| `stockfish-nnue.wasm`        | 453       | GPL-3.0    | [npm](https://www.npmjs.com/package/stockfish-nnue.wasm)        | [jsDelivr](https://www.jsdelivr.com/package/npm/stockfish-nnue.wasm)        |
| `lila-stockfish-web`         | 120       | AGPL-3.0   | [npm](https://www.npmjs.com/package/lila-stockfish-web)         | -                                                                           |

---

## 📦 パッケージ詳細

### 1. `stockfish` (推奨)

| 項目                     | 内容                                                          |
| ------------------------ | ------------------------------------------------------------- |
| **最新バージョン**       | 17.1.0                                                        |
| **Stockfish バージョン** | 17.1 (最新)                                                   |
| **メンテナー**           | Nathan Rugg ([nmrugg](https://github.com/nmrugg))             |
| **ライセンス**           | GPL-3.0                                                       |
| **週間ダウンロード**     | ~7,800                                                        |
| **GitHub Stars**         | ⭐ 1,107                                                      |
| **Forks**                | 157                                                           |
| **リポジトリ**           | [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js) |
| **最終更新**             | 2026-02-05 (アクティブ)                                       |
| **作成日**               | 2014-06-11                                                    |

#### 📈 バージョン履歴

| バージョン | Stockfish版 | リリース日 | 備考           |
| ---------- | ----------- | ---------- | -------------- |
| 17.1.0     | 17.1        | 2025-08 頃 | 最新、NNUE対応 |
| 16.0.0     | 16          | 2024-01 頃 |                |
| 15.1.0     | 15.1        | 2023-01 頃 |                |
| 10.0.0     | 10          | 2018-10 頃 |                |
| 8.0.0      | 8           | 2017-10 頃 | Chess.com貢献  |
| 6.0.0      | 6           | 2014-10 頃 | 初期版         |

#### ✅ 利用プロジェクト

- **Chess.com** - ブラウザ内分析エンジン (公式協力)
- 多数のチェスアプリ・ウェブサイト

#### 💡 特徴

- **Chess.com 公式協力**: Chess.comが開発に貢献
- **アクティブメンテナンス**: 2026年2月時点でも更新継続
- **NNUE対応**: 最新のニューラルネットワーク評価関数
- **Web Worker対応**: ブラウザでの非同期実行

#### 📝 CDN URL

```text
# jsDelivr
https://cdn.jsdelivr.net/npm/stockfish@17.1.0/stockfish-17.1.js

# unpkg
https://unpkg.com/stockfish@17.1.0/stockfish-17.1.js
```

---

### 2. `stockfish.wasm`

| 項目                     | 内容                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| **最新バージョン**       | 0.10.0                                                                      |
| **Stockfish バージョン** | ~15                                                                         |
| **メンテナー**           | Niklas Fiekas → lichess-org                                                 |
| **ライセンス**           | GPL-3.0                                                                     |
| **週間ダウンロード**     | ~940                                                                        |
| **GitHub Stars**         | ⭐ 328                                                                      |
| **リポジトリ**           | [lichess-org/stockfish.wasm](https://github.com/lichess-org/stockfish.wasm) |
| **最終コミット**         | 2023-03                                                                     |
| **作成日**               | 2018-11-05                                                                  |

#### 📈 バージョン履歴

| バージョン | リリース日 | 備考   |
| ---------- | ---------- | ------ |
| 0.10.0     | 2023-03 頃 | 最新   |
| 0.1.0      | 2018-11    | 初期版 |

#### ✅ 利用プロジェクト

- **Lichess.org** - ブラウザ内分析エンジン (公式)

#### 💡 特徴

- **Lichess 公式**: lichess-org 組織が管理
- **Niklas Fiekas 作成**: 元々は niklasf が開発
- **SharedArrayBuffer対応**: マルチスレッド
- **⚠️ 更新停滞**: 2023年以降更新なし (SF15止まり)

#### 📝 CDN URL

```text
# jsDelivr
https://cdn.jsdelivr.net/npm/stockfish.wasm@0.10.0/stockfish.js
https://cdn.jsdelivr.net/npm/stockfish.wasm@0.10.0/stockfish.wasm

# unpkg
https://unpkg.com/stockfish.wasm@0.10.0/stockfish.js
```

---

### 3. `stockfish.js`

| 項目                     | 内容                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| **最新バージョン**       | 10.0.2                                                                  |
| **Stockfish バージョン** | ~10 (古い)                                                              |
| **週間ダウンロード**     | ~1,500                                                                  |
| **リポジトリ**           | [lichess-org/stockfish.js](https://github.com/lichess-org/stockfish.js) |
| **⚠️ ステータス**        | 非推奨 - stockfish.wasm へ移行                                          |

#### 💡 特徴

- **レガシー**: 古いブラウザ用のJS版
- **非推奨**: 開発は stockfish.wasm に移行

---

### 4. `stockfish-nnue.wasm`

| 項目                 | 内容                               |
| -------------------- | ---------------------------------- |
| **最新バージョン**   | (調査中)                           |
| **週間ダウンロード** | ~450                               |
| **特徴**             | NNUE (ニューラルネット) 専用ビルド |

---

## 🏆 推奨パッケージ

### 本プロジェクトでの使用推奨順位

| 優先度 | パッケージ       | 理由                                  |
| ------ | ---------------- | ------------------------------------- |
| **1**  | `stockfish`      | 最新SF17.1、アクティブ、Chess.com実績 |
| 2      | `stockfish.wasm` | Lichess実績、SharedArrayBuffer対応    |
| 3      | (自前ビルド)     | 完全制御が必要な場合のみ              |

---

## 📊 比較表

| 項目               | `stockfish`   | `stockfish.wasm` |
| ------------------ | ------------- | ---------------- |
| **Stockfish版**    | 17.1 ✅       | ~15 ⚠️           |
| **週間DL**         | ~7,800        | ~940             |
| **Stars**          | 1,107         | 328              |
| **最終更新**       | 2026-02 ✅    | 2023-03 ⚠️       |
| **メンテナンス**   | アクティブ ✅ | 停滞 ⚠️          |
| **利用実績**       | Chess.com     | Lichess          |
| **マルチスレッド** | ✅            | ✅               |
| **NNUE**           | ✅            | ✅               |

---

## 💡 結論

**`stockfish` パッケージ (nmrugg/stockfish.js) を推奨**

1. **最新版**: Stockfish 17.1 対応
2. **アクティブ**: 2026年2月時点でも継続更新
3. **実績**: Chess.com が公式協力
4. **ダウンロード数**: 最多
5. **CDN対応**: jsDelivr / unpkg で即座に利用可能

### 推奨設定

```typescript
// packages/adapter-stockfish/src/default-sources.ts
export const DEFAULT_SOURCES = {
  primary: {
    js: "https://cdn.jsdelivr.net/npm/stockfish@17.1.0/stockfish-17.1.js",
    wasm: "https://cdn.jsdelivr.net/npm/stockfish@17.1.0/stockfish-17.1.wasm",
  },
  fallback: {
    js: "https://unpkg.com/stockfish@17.1.0/stockfish-17.1.js",
    wasm: "https://unpkg.com/stockfish@17.1.0/stockfish-17.1.wasm",
  },
};
```

この設定により:

- ✅ 自前 CDN 構築不要
- ✅ Stockfish 最新版が即座に利用可能
- ✅ jsDelivr + unpkg によるフォールバック
- ✅ SRI ハッシュ検証可能
