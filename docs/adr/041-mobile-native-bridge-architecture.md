# ADR-041: Mobile Native Bridge Architecture

## Status

Proposed

## Context

本プロジェクトは Web 標準 (WASM) を重視していますが、モバイルアプリケーション（Cordova/Capacitor 等）において最高性能 (Zenith Tier) を達成するためには、OS ネイティブの計算資源（C++/Native バイナリ、CoreML、NNAPI）を直接活用する「モバイル・ネイティブ・ブリッジ」が必要です。

WASM はポータビリティに優れますが、モバイル OS においてはネイティブ実行の方がスレッドスケジューリング、メモリ制御、および TPU/NPU へのアクセスにおいて優位性があるため、これを IEngine インターフェースを通じて透過的に利用できるようにします。

## Decision

Capacitor/Cordova 向けの汎用ブリッジ・アダプター `@multi-game-engines/adapter-mobile-bridge` を導入します。

### 1. アーキテクチャ構成

1. **IEngine Adapter (JS)**:
   - `@multi-game-engines/adapter-mobile-bridge`
   - Capacitor/Cordova プラグインをラップし、IEngine インターフェースを提供。
2. **Plugin Bridge (Native)**:
   - モバイルプロジェクト側で実装されるプラグイン（iOS: Swift/Objective-C, Android: Java/Kotlin）。
   - JS とネイティブエンジンのプロセス/スレッド間のパイプ。
3. **Native Engine (C++/Binary)**:
   - 各ゲームのエンジンコア。JNI (Android) や C++ Interop (iOS) でプラグインから呼び出されます。

### 2. インターフェース詳細

- **Command Path**: JS (`IEngine.search`) -> Plugin (`execute`) -> Native Engine (`stdin`/`API`)
- **Event Path**: Native Engine (`stdout`/`Callback`) -> Plugin (`notifyListeners`) -> JS (`onInfo`/`onSearchResult`)

### 3. ハードウェア加速の統合

- **Neural Network**: iOS では CoreML、Android では NNAPI を活用した評価関数の推論をプラグイン側でサポート。
- **Threads**: 各 OS のエネルギー管理プロファイルに合わせたスレッド優先度設定。

## Consequences

- **Positive**: モバイルアプリにおいて、ブラウザ版と同じ API でデスクトップ機に匹敵する探索性能を実現。
- **Negative**: モバイル OS 毎のネイティブプラグイン実装が必要になり、メンテナンス対象が増える。
- **Neutral**: `IEngine` 抽象化により、UI 層のコードは一切変更せずにモバイル最適化が可能。
