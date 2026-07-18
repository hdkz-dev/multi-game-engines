# Runbook: Mortal PyTorch → ONNX 変換 + 実 Worker 統合

## 目的

`adapter-mortal` を、現在のルールベーススタブ Worker (`scripts/mortal-stub-worker.js`) から、**Mortal 公式モデル** ベースの ONNX 推論 Worker に置き換える。

## 前提

- 現状: スタブ Worker が `MahjongJSON` プロトコルを実装、打牌は単純な末尾選択
- Mortal 公式: PyTorch (`*.pth`) で配布、AGPL-3.0
- アダプタ (`MortalAdapter`) は MahjongJSON Worker 経由で動作 (プロトコル準拠)

## ⚠️ 法務確認 (必須先決事項)

Mortal の **AGPL-3.0 ライセンス** が `multi-game-engines` (MIT) と組み合わせて配布可能か、以下を確認:

- [ ] 推論モデル (`.pth` / `.onnx`) の二次配布が AGPL に違反しないか
- [ ] エンドユーザーがブラウザで実行する場合、AGPL の "Network" 条項 (Section 13) が適用されるか
- [ ] 推論コードが AGPL 派生物となる範囲 (Worker のみ AGPL、他は MIT に分離可能か)

**推奨**: ADR を起こし、配布スキームを明文化してから実装に進む (`docs/adr/0XX-mortal-license.md`)。

## 手順 (法務 OK 後)

### 1. PyTorch 環境準備

```bash
# uv または pyenv でバージョン分離
python3 -m venv .venv-mortal
source .venv-mortal/bin/activate
pip install torch onnx numpy
git clone https://github.com/Equim-chan/Mortal.git /tmp/mortal-src
```

### 2. ONNX 変換スクリプト作成

```python
# scripts/convert-mortal-onnx.py (新規想定)
import torch
import sys
sys.path.insert(0, "/tmp/mortal-src")
from libriichi.mjai import Bot
from mortal.model import Brain, DQN

# Mortal の事前学習済 .pth を読み込み
state_dict = torch.load("mortal.pth", map_location="cpu")
brain = Brain(...)  # 公式コードのコンストラクタに合わせる
dqn = DQN(brain, ...)
dqn.load_state_dict(state_dict)
dqn.eval()

# 入力テンソルの形状は libriichi のドキュメントに従う (例: [1, 938])
dummy_input = torch.zeros(1, 938)
torch.onnx.export(
    dqn,
    dummy_input,
    "mortal.onnx",
    opset_version=17,
    input_names=["state"],
    output_names=["q_values"],
    dynamic_axes={"state": {0: "batch"}},
)

# 検証
import onnx
model = onnx.load("mortal.onnx")
onnx.checker.check_model(model)
print("✅ Mortal ONNX exported and validated")
```

### 3. Worker 書き換え

**置換対象**: `scripts/mortal-stub-worker.js` → `scripts/mortal-onnx-worker.js`

```js
// scripts/mortal-onnx-worker.js (新規想定)
import * as ort from "onnxruntime-web";

let session = null;

async function loadModel(modelUrl) {
  if (!session) {
    session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["webgpu", "wasm"],
    });
  }
  return session;
}

// MahjongJSON プロトコルに沿って推論
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "search") {
    const session = await loadModel("/assets/mortal/1.0/mortal.onnx");

    // 1. board state を libriichi 互換のテンソルに変換
    const stateTensor = encodeMahjongState(payload.board);

    // 2. ONNX 推論
    const feeds = { state: new ort.Tensor("float32", stateTensor, [1, 938]) };
    const results = await session.run(feeds);

    // 3. q_values から最良打牌を選択
    const qValues = results.q_values.data;
    const bestActionIdx = argMax(qValues);
    const bestMove = decodeMahjongAction(bestActionIdx);

    // 4. MahjongJSON 形式で返却
    self.postMessage({
      type: "result",
      payload: { bestMove, evaluations: top5(qValues) },
    });
  }
};
```

**新規実装が必要な関数**:

- `encodeMahjongState(board)`: 手牌・河・ドラ・場況を 938 次元ベクトルへ
- `decodeMahjongAction(idx)`: action_idx → 打牌 (e.g., `"1m"`, `"5p"`, `"chi"`, `"pon"`, `"riichi"`)
- libriichi の Python 実装 (`libriichi/mjai/bot.py`) を JS に移植

### 4. CI ジョブ拡張

`build-wasm.yml:build-mortal` を更新:

```yaml
build-mortal:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: "3.11"
    - name: Install PyTorch
      run: pip install torch onnx numpy
    - name: Convert Mortal model
      env:
        MORTAL_PTH_URL: ${{ secrets.MORTAL_PTH_URL }}
      run: |
        if [[ -n "${MORTAL_PTH_URL:-}" ]]; then
          curl -L -o /tmp/mortal.pth "${MORTAL_PTH_URL}"
          python3 scripts/convert-mortal-onnx.py /tmp/mortal.pth /tmp/mortal.onnx
        else
          echo "ℹ️  MORTAL_PTH_URL not set — falling back to stub worker"
          cp scripts/mortal-stub-worker.js /tmp/mortal.js
        fi
    # SRI はここで計算しない。docs.yml が Pages へデプロイした後、
    # refresh-sri.yml が公開 URL から取得して engines.json に反映する。
    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: mortal-onnx-v1.0
        path: /tmp/mortal.onnx
```

### 5. アダプタ更新

`packages/adapter-mortal/src/MortalAdapter.ts` に ONNX runtime を渡す処理を追加 (現状は worker.js のみで完結しているため、ファイル形式判定が必要):

```ts
// MortalAdapter.ts
async load() {
  // 既存ロジック ...
  const isOnnx = source.url.endsWith(".onnx");
  const workerScript = isOnnx
    ? "/runtime/mortal-onnx-worker.js"  // ONNX 用 Worker
    : source.url;                        // スタブ Worker (旧)

  this.communicator = new WorkerCommunicator(workerScript);
  // ...
}
```

### 6. テスト

```bash
# 単体テスト
cd packages/adapter-mortal && pnpm test

# 統合テスト (E2E)
pnpm test:e2e -- --filter mortal

# 麻雀ベンチマーク (参考: vs スタブ Worker の打牌精度)
pnpm bench:mortal
```

### 7. 検証チェックリスト

- [ ] AGPL ライセンスの法務確認完了 (ADR 起票)
- [ ] `mortal.onnx` が CI でビルドされる
- [ ] SHA-384 が `engines.json` に反映される
- [ ] アダプタが ONNX Worker を起動できる
- [ ] 麻雀の標準局面 (配牌・捨牌) で妥当な打牌を返す
- [ ] スタブ Worker (`mortal-stub-worker.js`) は **削除せず** 残す (フォールバック用)

### 8. ロールバック

```bash
# Secret 削除でスタブに戻す
gh secret delete MORTAL_PTH_URL
gh workflow run build-wasm.yml
```

## 想定工数

| 段階                                       | 工数                            |
| ------------------------------------------ | ------------------------------- |
| 法務確認 + ADR 起票                        | 1〜2 日 (要 OSS ライセンス知識) |
| PyTorch 環境構築 + 公式コード読み込み      | 1 日                            |
| ONNX 変換スクリプト作成 + 検証             | 1〜2 日                         |
| Worker 書き換え (state encode/decode 含む) | 2〜3 日                         |
| CI ジョブ拡張                              | 半日                            |
| 統合テスト + ベンチ                        | 1 日                            |
| **合計**                                   | **約 1 週間**                   |

## 関連 PR / ADR

- PR #134: スタブ Worker 配信 (BLOCKER-B 解決)
- ADR-014: バイナリ配布の物理分離

## 補足

Mortal 以外の麻雀 AI モデル候補:

- **Suphx (Microsoft)** — 非公開
- **NAGA (DMV)** — 商用 API 限定
- **akochan** — オープンソース、Rust ベース、ONNX 化が現実的か未検証

Mortal の AGPL を回避したい場合は、`adapter-mortal` を別パッケージ (`adapter-akochan` 等) に置き換える選択肢もある。
