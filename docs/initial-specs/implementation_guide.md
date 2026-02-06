# 実装ガイド: ゲームエンジン統合

## 1. 共通抽象化レイヤー

Native PluginとWebAssembly (Wasm) を透過的に扱うため、共通インターフェースを定義します。

```typescript
// types/engine.ts

export type EngineEvent =
  | { type: "ready" }
  | { type: "info"; output: string }
  | { type: "bestmove"; move: string; ponder?: string }
  | { type: "error"; message: string };

export interface IGameEngine {
  /** エンジンの初期化 */
  init(): Promise<void>;

  /** UCI/USIコマンドの送信 */
  sendCommand(command: string): void;

  /** 思考開始 (go/go ponder) */
  startSearch(options: { depth?: number; time?: number }): void;

  /** 思考停止 */
  stopSearch(): void;

  /** 破棄 */
  terminate(): void;

  /** イベントリスナー登録 */
  on(event: "message", callback: (event: EngineEvent) => void): void;
}
```

## 2. WebAssembly (Wasm) 実装パターン

`Web Worker` を使用してメインスレッドをブロックせずにエンジンを実行します。

### 2.1 Workerの実装 (Stockfish例)

```typescript
// lib/engines/stockfish/worker.ts
// ※実際には public/workers/stockfish.js などを読み込むラッパー

class WasmStockfishEngine implements IGameEngine {
  private worker: Worker;

  async init() {
    this.worker = new Worker(new URL("./stockfish.worker.js", import.meta.url));
    this.worker.onmessage = (e) => {
      // UCIプロトコルのパース処理
      const line = e.data;
      if (line.startsWith("bestmove")) {
        this.emit({ type: "bestmove", ...parseBestMove(line) });
      } else {
        this.emit({ type: "info", output: line });
      }
    };
    this.worker.postMessage("uci");
  }

  sendCommand(cmd: string) {
    this.worker.postMessage(cmd);
  }

  // ... 他の実装
}
```

### 2.2 Next.js設定

`next.config.mjs` でWasmファイルの読み込みを許可する必要があります。
(Webpackの設定が必要な場合があります)

## 3. Native Plugin (Capacitor) 実装パターン

C++エンジンをラップするCapacitorプラグインを作成します。

### 3.1 プラグイン定義

```typescript
// plugins/shogi-engine/definitions.ts
export interface ShogiEnginePlugin {
  initialize(options: { enginePath: string }): Promise<void>;
  sendCommand(options: { command: string }): Promise<void>;
  addListener(
    eventName: "engineOutput",
    listenerFunc: (data: { line: string }) => void,
  ): Promise<PluginListenerHandle>;
}
```

### 3.2 iOS実装 (Objective-C++ / Swift)

1.  **C++ソースの取り込み**: プロジェクトにYaneuraOu等のソースコードを追加。
2.  **Bridging Header**: C++クラスをObjective-C++ (.mm) でラップし、Swiftから呼べるようにする。
3.  **Capacitor Plugin**:

```swift
// ShogiEnginePlugin.swift
@objc(ShogiEnginePlugin)
public class ShogiEnginePlugin: CAPPlugin {
    private var engineWrapper: EngineWrapper?

    @objc func initialize(_ call: CAPPluginCall) {
        // バックグラウンドスレッドでエンジン起動
        DispatchQueue.global(qos: .userInitiated).async {
            self.engineWrapper = EngineWrapper()
            self.engineWrapper?.start()
            call.resolve()
        }
    }

    @objc func sendCommand(_ call: CAPPluginCall) {
        guard let command = call.getString("command") else { return }
        self.engineWrapper?.send(command)
        call.resolve()
    }

    // エンジンからの出力をJSへ送る
    func onEngineOutput(_ line: String) {
        self.notifyListeners("engineOutput", data: ["line": line])
    }
}
```

### 3.3 Android実装 (Java/Kotlin + JNI)

1.  **CMakeLists.txt**: C++ソースをコンパイルして `libshogi.so` 等を作成。
2.  **JNI Wrapper**: JavaからC++関数を呼ぶためのJNIメソッド定義。
3.  **Capacitor Plugin**:

```java
@CapacitorPlugin(name = "ShogiEngine")
public class ShogiEnginePlugin extends Plugin {

    static {
        System.loadLibrary("shogi_engine");
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        new Thread(() -> {
            nativeInit(); // JNI呼び出し
            call.resolve();
        }).start();
    }

    // C++側からcallbackで呼ばれるメソッド
    public void onNativeOutput(String line) {
        JSObject ret = new JSObject();
        ret.put("line", line);
        notifyListeners("engineOutput", ret);
    }
}
```

## 4. ファクトリーパターンによる切り替え

```typescript
import { Capacitor } from "@capacitor/core";
import { WasmStockfishEngine } from "./wasm-stockfish";
import { NativeStockfishEngine } from "./native-stockfish"; // Capacitorプラグインラッパー

export function createEngine(gameType: "chess" | "shogi"): IGameEngine {
  const isNative = Capacitor.isNativePlatform();

  if (gameType === "chess") {
    // ChessはどちらでもWasmで十分性能が出るためWasm推奨
    // ただし超高速解析が必要ならNativeへ分岐可能
    return new WasmStockfishEngine();
  }

  if (gameType === "shogi") {
    if (isNative) {
      // Native (YaneuraOu Capacitor Plugin)
      return new NativeYaneuraOuEngine();
    } else {
      // Web Fallback (Wasm YaneuraOu)
      return new WasmYaneuraOuEngine();
    }
  }

  throw new Error("Unsupported game type");
}
```

## 5. 推奨ステップ

1.  **Phase 1 (プロトタイプ)**: 全て `Wasm` で実装。Web/Native両方で動作確認。
2.  **Phase 2 (最適化)**: `KataGo` (Go) と `YaneuraOu` (Shogi) についてのみ、Capacitorプラグイン化に着手。
3.  **Phase 3 (完成)**: Nativeプラグイン完成後、上記ファクトリーパターンで切り替え。
