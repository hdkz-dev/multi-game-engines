#!/usr/bin/env python3
"""Create a minimal valid KataGo-compatible ONNX stub for CI / development use.

This generates an ONNX model whose input/output tensor names and shapes exactly
match what KataGoONNXAdapter expects, but whose weights are deterministic random
values (seed=42).  It is NOT a real Go AI — it exists solely so that:

  - GitHub Pages can serve a valid `.onnx` file at the katago/1.14 path
  - `pnpm sri:refresh` can compute a stable SHA-384 and update engines.json
  - adapter-katago's integration tests can exercise the full adapter pipeline

For production use, supply a real KataGo ONNX model via config.sources.main.url.

Requirements (already available on GitHub-hosted ubuntu-latest runners):
  pip install onnx numpy

Input tensors (KataGo v5 format):
  bin_input_global_ncplane  float32  [1, 22, 19, 19]
  global_input              float32  [1, 19]

Output tensors:
  policy                    float32  [1, 362]   (19×19 board + pass)
"""

import sys
import struct
import numpy as np

try:
    import onnx
    from onnx import helper, TensorProto, numpy_helper, checker
except ImportError:
    print("ERROR: onnx not installed. Run: pip install onnx numpy", file=sys.stderr)
    sys.exit(1)

# ── Constants ────────────────────────────────────────────────────────────────
BOARD_SIZE = 19
INPUT_PLANES = 22       # KataGo v5 spatial planes
GLOBAL_FEATURES = 19    # KataGo v5 global scalar features
POLICY_SIZE = BOARD_SIZE * BOARD_SIZE + 1   # 362  (pass = last element)

INPUT_SPATIAL = INPUT_PLANES * BOARD_SIZE * BOARD_SIZE   # 7942
INPUT_TOTAL = INPUT_SPATIAL + GLOBAL_FEATURES             # 7961

OUTPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else "katago-b6c96.onnx"

# ── Weight initialisation (fixed seed → reproducible SRI hash) ───────────────
rng = np.random.default_rng(42)
W = (rng.standard_normal((INPUT_TOTAL, POLICY_SIZE)) * 0.01).astype(np.float32)
B = np.zeros(POLICY_SIZE, dtype=np.float32)

W_init = numpy_helper.from_array(W, name="fc_w")
B_init = numpy_helper.from_array(B, name="fc_b")

# ── Graph definition ─────────────────────────────────────────────────────────
bin_input = helper.make_tensor_value_info(
    "bin_input_global_ncplane", TensorProto.FLOAT, [1, INPUT_PLANES, BOARD_SIZE, BOARD_SIZE]
)
global_input = helper.make_tensor_value_info(
    "global_input", TensorProto.FLOAT, [1, GLOBAL_FEATURES]
)
policy_out = helper.make_tensor_value_info(
    "policy", TensorProto.FLOAT, [1, POLICY_SIZE]
)

# Flatten spatial input [1, C, N, N] → [1, C*N*N]
flatten_node = helper.make_node(
    "Flatten",
    inputs=["bin_input_global_ncplane"],
    outputs=["flat_spatial"],
    axis=1,
)

# Concatenate with global features → [1, C*N*N + 19]
concat_node = helper.make_node(
    "Concat",
    inputs=["flat_spatial", "global_input"],
    outputs=["combined"],
    axis=1,
)

# Linear projection → [1, POLICY_SIZE]
matmul_node = helper.make_node(
    "MatMul",
    inputs=["combined", "fc_w"],
    outputs=["logits"],
)
add_node = helper.make_node(
    "Add",
    inputs=["logits", "fc_b"],
    outputs=["policy"],
)

graph = helper.make_graph(
    [flatten_node, concat_node, matmul_node, add_node],
    "katago-stub-b6c96",
    [bin_input, global_input],
    [policy_out],
    [W_init, B_init],
)

model = helper.make_model(
    graph,
    opset_imports=[helper.make_opsetid("", 17)],
)
model.ir_version = 8
model.doc_string = (
    "KataGo b6c96 ONNX stub — random weights, development/CI use only. "
    "For production, supply a real KataGo ONNX model via config.sources.main.url."
)
model.model_version = 1

# ── Validate and save ────────────────────────────────────────────────────────
checker.check_model(model)
onnx.save(model, OUTPUT_PATH)

size_kb = len(open(OUTPUT_PATH, "rb").read()) / 1024
print(f"✅  Created {OUTPUT_PATH}  ({size_kb:.1f} KB)")
print(f"    Inputs:  bin_input_global_ncplane [1,{INPUT_PLANES},{BOARD_SIZE},{BOARD_SIZE}]")
print(f"             global_input [1,{GLOBAL_FEATURES}]")
print(f"    Outputs: policy [1,{POLICY_SIZE}]")
print(f"    NOTE: stub model — not a real AI, for testing only")
