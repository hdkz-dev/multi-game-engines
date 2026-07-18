# Runbook: KataGo Real Model Integration

## 目的

`adapter-katago` が現在使用しているスタブ ONNX モデルを、実モデルへ無停止で切り替える。

## 前提

- `build-wasm.yml:build-katago` ジョブが `KATAGO_ONNX_URL` secret を参照する実装済 (PR #134)
- secret 未設定時はスタブモデル (`scripts/create-katago-stub-onnx.py`) を自動生成
- `adapter-katago` は `KataGoONNXAdapter` (ONNX Runtime Web) で動作、モデル切替に対するコード変更は不要

## 手順

### 1. 実モデルの ONNX 変換 URL を確保

KataGo 公式は `.bin.gz` 形式で配布しており、ONNX 化されたモデルは公式提供されていない。以下のいずれか:

- **オプション A**: コミュニティ製の事前変換 ONNX モデルを利用 (例: Hugging Face / 個人配信 CDN)
- **オプション B**: 自前で `KaTrain` 等から PyTorch チェックポイントを取得し、`torch.onnx.export` で変換した上で HTTPS 配信

**変換例 (オプション B 用)**:

```python
# scripts/convert-katago-onnx.py (新規想定)
import torch
import onnx
from katago.modelinference import Model  # 仮 — 実 API に合わせて調整

model = Model.load_from_checkpoint("kata1-b6c96-s175395328-d26788732.bin.gz")
model.eval()

bin_input = torch.zeros(1, 22, 19, 19)
global_input = torch.zeros(1, 19)

torch.onnx.export(
    model,
    (bin_input, global_input),
    "katago-b6c96.onnx",
    opset_version=17,
    input_names=["bin_input_global_ncplane", "global_input"],
    output_names=["policy"],
    dynamic_axes={"bin_input_global_ncplane": {0: "batch"}, "global_input": {0: "batch"}},
)
```

**入出力テンソル形状** (`scripts/create-katago-stub-onnx.py` と一致):

| Name                       | Shape             | Dtype   |
| -------------------------- | ----------------- | ------- |
| `bin_input_global_ncplane` | `[1, 22, 19, 19]` | float32 |
| `global_input`             | `[1, 19]`         | float32 |
| `policy` (output)          | `[1, 362]`        | float32 |

形状が違うとアダプタ側でエラーになるため、変換時に必ず一致させる。

### 2. URL を HTTPS で公開

R2 / S3 / GitHub Releases / 個人 CDN いずれでも可。CORS が GitHub Pages から許可されている必要あり (`Access-Control-Allow-Origin: *` 推奨)。

### 3. GitHub Secret に登録

```bash
gh secret set KATAGO_ONNX_URL -b "https://example.com/path/to/katago-b6c96.onnx"
```

### 4. ビルド再実行

```bash
gh workflow run build-wasm.yml
```

完了後 (約 5 分):

- `build-katago` ジョブが実モデルをダウンロードし artifact をアップロード
- `docs.yml` が artifact を GitHub Pages にステージング
- `refresh-sri.yml` が `pnpm sri:refresh` → `engines.json` 更新 → 自動 PR 作成

### 5. 検証

```bash
# 実モデルのハッシュが反映されているか
curl -I https://hdkz-dev.github.io/multi-game-engines/assets/katago/1.14/katago-b6c96.onnx
# → Content-Length が約 18 MiB (b6c96 モデル) になっていることを確認

# engines.json の SRI が更新されているか
git fetch && git diff origin/main -- packages/registry/data/engines.json | grep katago

# 統合テスト (ローカル)
cd packages/adapter-katago && pnpm test
```

### 6. ロールバック手順

問題発生時:

```bash
# Secret を削除すれば次回ビルドでスタブに戻る
gh secret delete KATAGO_ONNX_URL
gh workflow run build-wasm.yml
```

`engines.json` の SRI は `refresh-sri.yml` で再計算され、スタブのハッシュに自動的に戻る。

## 想定工数

- ONNX 変換済 URL がすでにある: **5 分** (secret 設定 + workflow run)
- 自前で変換: **数日〜1 週間** (PyTorch 環境構築 + 変換 + 形状検証)

## 関連 PR / ADR

- PR #134 (BLOCKER-B 解決): スタブ生成ジョブの追加
- ADR-014: バイナリ配布の物理分離
