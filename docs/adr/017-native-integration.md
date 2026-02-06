# ADR-017: Hybrid/Native Integration (将来のモバイルアプリ対応)

- **ステータス**: 承認済み
- **日付**: 2026-02-06

## 1. コンテキスト (Context)

将来的に React Native や Capacitor を用いたスマホアプリ展開を検討している。WASM はブラウザでは強力だが、モバイル OS 上ではネイティブビルド（C++ / NDK）の方が CPU 命令をより直接的に活用でき、実行速度や省電力性で勝る。

## 2. 決定 (Decision)

1. **Native Bridge の許容**: `IEngineAdapter` 越しにネイティブプラグイン（Native Modules / JSI）と通信する `NativeBridgeAdapter` の設計を公式に採用する。
2. **透過的切り替え**: UI 側（`IEngine` 利用側）は、実行環境が Web かネイティブかを意識せず、単一の API で探索を制御できるようにする。
3. **ライセンスの維持**: ネイティブ環境でもエンジンを別プロセスとして実行することで、GPL 隔離を継続する。

## 3. 結果 (Consequences)

- **メリット**:
  - スマホ性能を極限まで引き出せる。
  - モバイル特有のバックグラウンド実行等に対応可能。
- **デメリット**:
  - 各 OS（Android/iOS）向けのネイティブビルドとブリッジの実装コストが発生する。

## 4. 参照 (References)

- [エンジン統合ロードマップ (Stage 3)](../infrastructure/cdn/ENGINE_ALTERNATIVES.md)
