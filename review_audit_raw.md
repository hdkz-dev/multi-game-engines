### Comment ID: 2825071720

**User**: gemini-code-assist[bot]
**Path**: packages/core/src/bridge/EngineLoader.ts:49
**Body**:
![security-high](https://www.gstatic.com/codereviewagent/security-high-priority.svg) ![high](https://www.gstatic.com/codereviewagent/high-priority.svg)

The origin validation for engine resources (lines 47-49) only applies when `config.type` is exactly `"worker-js"` or `"wasm"`. However, the `getMimeType` method (lines 19-32) and the subsequent fetch/blob logic allow any string for `config.type`, defaulting to `"application/javascript"`.

An attacker could provide a different type string (e.g., `"script"`) to bypass the `validateWorkerUrl` check. This would allow them to fetch a malicious cross-origin script (provided they also supply the correct SRI hash) and have it loaded as a same-origin Worker via a Blob URL, leading to arbitrary code execution in a Worker context.

**Remediation:** Apply `validateWorkerUrl` to all resource types that can result in an executable MIME type (like `application/javascript` or `application/wasm`), or restrict `config.type` to a strict allow-list of known safe types.

---

### Comment ID: 2825071726

**User**: gemini-code-assist[bot]
**Path**: packages/core/src/bridge/EngineBridge.ts:223
**Body**:
![security-medium](https://www.gstatic.com/codereviewagent/security-medium-priority.svg) ![medium](https://www.gstatic.com/codereviewagent/medium-priority.svg)

The `getEngine` method (line 179) now accepts an `IEngineConfig` object, enabling dynamic engine instantiation from external configurations. The `id` and `url` properties from this configuration are used by the `EngineLoader` to construct cache keys (e.g., `${engineId}_${config.url}`) without any sanitization.

If this configuration is derived from untrusted user input, an attacker could use path traversal sequences (e.g., `../`) in the `id` property to manipulate the storage keys. This could allow them to read or overwrite files in the underlying storage (such as the Origin Private File System or a server-side filesystem), potentially leading to data corruption or unauthorized access to other engine resources.

**Remediation:** Sanitize the `id` and `url` properties to remove path traversal characters before using them as storage keys, or use a cryptographic hash of the configuration as the unique cache key.

---

### Comment ID: 2825071730

**User**: gemini-code-assist[bot]
**Path**: examples/zenith-dashboard-vue/pages/index.vue:48
**Body**:
![medium](https://www.gstatic.com/codereviewagent/medium-priority.svg)

この型キャスト (`as IEngine<...>`) は不要だと思われます。

`getEngine` メソッドは、アダプターパッケージ側での宣言併合（declaration merging）により、`"stockfish"` や `"yaneuraou"` といった具体的なIDに対して、すでに正しい型 (`Promise<EngineRegistry['stockfish']>` など) を返すように設計されています。

このキャストを削除することで、PRの目標である「Zero-Any Policy」の原則をより遵守し、TypeScriptの型推論に完全に依存した、よりクリーンで安全なコードになります。もし型推論が正しく機能していない場合、`tsconfig.json` の設定に問題がある可能性も考えられます。

```
      chessEngine.value = chess;
      shogiEngine.value = shogi;
```

<details>
<summary>References</summary>

1. ジェネリクスやBranded Typesの使用が一貫しているか確認し、型安全性を守る必要があります。不要な型キャストは型安全性を損なう可能性があるため、可能な限り避けるべきです。 <sup>([link](https://github.com/hdkz-dev/multi-game-engines/blob/main/.gemini/styleguide.md))</sup>
</details>

---

### Comment ID: 2825071733

**User**: gemini-code-assist[bot]
**Path**: packages/adapter-usi/src/USIParser.ts:153
**Body**:
![medium](https://www.gstatic.com/codereviewagent/medium-priority.svg)

このコメントは「`none` または `(none)` の場合に `null` を返す」と示唆していますが、現在の実装では `MOVE_REGEX` がこれらの文字列を許可するため、`createMove` は有効な `Move` オブジェクトを返し、結果として `bestmove` が `"none"` である `ISHOGISearchResult` オブジェクトが返されます。

もし「指し手なし」を `null` 結果として扱いたいのであれば、`bestmove` の値をチェックして明示的に `null` を返す方が、呼び出し元での解釈が簡素化され、意図が明確になります。

```typescript
const moveStr = parts[1] || "";
if (moveStr === "none" || moveStr === "(none)") {
  return null;
}

const bestMove = this.createMove(moveStr);
```

---

### Comment ID: 2825083682

**User**: coderabbitai[bot]
**Path**: docs/ZENITH*STANDARD.md:55
**Body**:
*⚠️ Potential issue* | *🔴 Critical\_

<details>
<summary>🧩 Analysis chain</summary>

🏁 Script executed:

```shell
#!/bin/bash

echo "=== Searching for doc-sync.js file ==="
fd "doc-sync" --type=f

echo ""
echo "=== Checking for doc-sync references in .github/ ==="
rg "doc-sync" .github/ 2>/dev/null || echo "No references found in .github/"

echo ""
echo "=== Checking scripts directory content ==="
if [ -d "scripts" ]; then
  ls -la scripts/ 2>/dev/null | head -20
else
  echo "scripts directory not found"
fi

echo ""
echo "=== Checking .github directory structure ==="
find .github/ -type f -name "*.yml" -o -name "*.yaml" 2>/dev/null | head -20
```

Repository: hdkz-dev/multi-game-engines

Length of output: 592

---

</details>

**`scripts/doc-sync.js` は存在せず、GitHub Actions ワークフローに統合されていません**

検証の結果、docs/ZENITH_STANDARD.md の Section 3.1 で言及されている `scripts/doc-sync.js` はリポジトリに存在していません。また、.github/workflows/ 内の CI ワークフロー（ci.yml、release.yml）には doc-sync に関する参照がありません。

scripts/ ディレクトリには `pre-commit-check.sh` と `sync-mcp-tokens.js` のみが存在し、ドキュメントで説明されている自動同期スクリプトと CI 統合は実装されていません。ドキュメントの記述と実装状況の乖離を解決してください。

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@docs/ZENITH_STANDARD.md` around lines 54 - 55, The doc claims a
scripts/doc-sync.js and CI integration that don't exist; either implement the
sync script and wire it into CI or remove/update the doc. Create a new
doc-sync.js that invokes TypeDoc (or generates the API reference) and compares
the generated output against the repository Markdown (e.g., TECHNICAL_SPECS.md),
returning a non-zero exit code on mismatch; add a package.json script entry
(e.g., "doc-sync") and integrate that script into the existing CI workflows
(ci.yml and release.yml) as a validation step so PRs fail on divergence; if you
opt not to implement, instead update ZENITH_STANDARD.md to remove or clarify the
doc-sync reference and mention the current scripts (pre-commit-check.sh,
sync-mcp-tokens.js) so the documentation matches the repo state.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825083684

**User**: coderabbitai[bot]
**Path**: packages/core/src/bridge/EngineLoader.ts:56
**Body**:
_⚠️ Potential issue_ | _🔴 Critical_

<details>
<summary>🧩 Analysis chain</summary>

🏁 Script executed:

```shell
# First, let's examine the actual EngineLoader.ts file to see the code context
cat -n packages/core/src/bridge/EngineLoader.ts | head -80
```

Repository: hdkz-dev/multi-game-engines

Length of output: 3202

---

🏁 Script executed:

```shell
# Check the validateWorkerUrl method around line 230
cat -n packages/core/src/bridge/EngineLoader.ts | sed -n '220,260p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 1360

---

🏁 Script executed:

```shell
# Search for all window references in the file
rg -n 'window' packages/core/src/bridge/EngineLoader.ts
```

Repository: hdkz-dev/multi-game-engines

Length of output: 276

---

🏁 Script executed:

```shell
# Check if there are SSR or Node.js environment tests
fd -t f '\.(test|spec)\.' packages/core/src/bridge/ -x cat -n {} \; | grep -A 5 -B 5 -i 'ssr\|node\|window'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 462

---

🏁 Script executed:

```shell
# Check if window is guarded anywhere in the codebase
rg -n 'typeof window' packages/core/src/bridge/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
# Check package.json or README for SSR mentions
rg -i 'ssr|next.js' packages/core/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
# Check if EngineLoader is marked as browser-only or has any JSDoc indicating usage context
cat -n packages/core/src/bridge/EngineLoader.ts | head -20
```

Repository: hdkz-dev/multi-game-engines

Length of output: 821

---

🏁 Script executed:

```shell
# Check the types.ts to understand IEngineLoader interface
rg -A 10 'interface IEngineLoader' packages/core/src/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 632

---

🏁 Script executed:

```shell
# Check where EngineLoader is imported/used in the codebase
rg -n 'EngineLoader' packages/core/src/ --type=ts | grep -v '\.test\.'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 1601

---

🏁 Script executed:

```shell
# Check the actual test file to see full context
fd -name '*.test.ts' packages/core/src/bridge/ -exec cat -n {} \;
```

Repository: hdkz-dev/multi-game-engines

Length of output: 301

---

🏁 Script executed:

```shell
# Check package exports to see if EngineLoader is exposed publicly
rg -n 'export.*EngineLoader' packages/core/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 317

---

🏁 Script executed:

```shell
# Check if EngineLoader is documented as browser-only or has any platform constraints
cat -n packages/core/src/bridge/EngineLoader.ts | sed -n '10,20p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 525

---

🏁 Script executed:

```shell
# Check the test file to see how window is handled in Node.js context
find packages/core -name '*.test.ts' -path '*/bridge/*' -exec cat {} \;
```

Repository: hdkz-dev/multi-game-engines

Length of output: 2745

---

🏁 Script executed:

```shell
# Verify if window is used elsewhere in the codebase and how it's guarded
rg 'typeof window' packages/core/src/ --type=ts
```

Repository: hdkz-dev/multi-game-engines

Length of output: 193

---

🏁 Script executed:

```shell
# Check if there are separate browser vs Node.js implementations
fd -type f -name '*browser*' -o -name '*node*' packages/core/src/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 241

---

🏁 Script executed:

```shell
# Check if there's any SSR documentation or Next.js configuration
find packages/core -name 'README*' -o -name 'package.json' | xargs cat | grep -i -A 5 -B 5 'ssr\|next\|server'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
# Check if EngineLoader is conditionally imported or feature-gated for browser-only
rg -B 5 -A 5 'EngineLoader' packages/core/src/bridge/EngineBridge.ts | head -30
```

Repository: hdkz-dev/multi-game-engines

Length of output: 742

---

🏁 Script executed:

```shell
# Verify if there's a browser-specific export or polyfill setup
cat packages/core/src/index.ts 2>/dev/null || echo "File not found"
```

Repository: hdkz-dev/multi-game-engines

Length of output: 768

---

🏁 Script executed:

```shell
# Check if EngineLoader.ts or related files have any `@browser` or similar JSDoc tags
rg '@browser|@client|browser-only' packages/core/src/bridge/
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
# Look for environment-based code splitting or dynamic imports that might indicate SSR awareness
rg 'typeof window|typeof document|typeof global|isClient|isBrowser' packages/core/src/ --type=ts
```

Repository: hdkz-dev/multi-game-engines

Length of output: 300

---

🏁 Script executed:

```shell
# Check the full context of SecurityAdvisor.ts to see the guard pattern
cat -n packages/core/src/capabilities/SecurityAdvisor.ts | sed -n '1,50p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 1597

---

🏁 Script executed:

```shell
# Verify if EngineBridge dynamically loads EngineLoader for browser only
cat -n packages/core/src/bridge/EngineBridge.ts | sed -n '355,375p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 899

---

🏁 Script executed:

```shell
# Check if there are any environment detection utilities in the codebase
rg -n 'isBrowser|isNode|isServer' packages/core/src/ --type=ts
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
# Look at the actual line where EngineLoader is instantiated
cat -n packages/core/src/bridge/EngineBridge.ts | sed -n '355,375p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 899

---

</details>

**`window.location` は SSR/Node.js 環境で `ReferenceError` を引き起こします**

Line 52、230、236 で `window.location.href` と `window.location.origin` を参照していますが、SSR 環境では `window` オブジェクトが存在しません。現在のテストは `vi.stubGlobal("window", {...})` でモック化されているため通過していますが、実際の SSR 環境では実行時エラーになります。

`SecurityAdvisor.ts` と同様に、`typeof window !== "undefined"` ガードを追加してください。またはSSR環境での代替実装を用意してください。

<details>
<summary>修正案</summary>

```diff
-        const url = new URL(config.url, window.location.href);
+        const base = typeof window !== "undefined" ? window.location.href : "https://localhost";
+        const url = new URL(config.url, base);
```

```diff
-      const parsedUrl = new URL(url, window.location.href);
-      // ...
-      if (parsedUrl.origin !== window.location.origin && !isLoopback) {
+      const base = typeof window !== "undefined" ? window.location.href : "https://localhost";
+      const parsedUrl = new URL(url, base);
+      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://localhost";
+      if (parsedUrl.origin !== currentOrigin && !isLoopback) {
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/bridge/EngineLoader.ts` around lines 52 - 56, EngineLoader
currently accesses window.location (e.g. the new URL(config.url,
window.location.href) expression and the origin checks that compute isLoopback
and the other uses around lines 230/236), which will throw in SSR/Node; wrap
those accesses with a typeof window !== "undefined" guard and provide a safe
fallback (for example use config.url as the base or an empty string/origin
fallback) so the URL() construction and hostname/origin checks run only when
window exists; update the URL creation, isLoopback computation, and any
location-origin reads in EngineLoader.ts to use this guard and fallback behavior
similarly to SecurityAdvisor.ts.
```

</details>

<!-- fingerprinting:phantom:medusa:phoenix -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825083691

**User**: coderabbitai[bot]
**Path**: packages/core/src/domains/chess/index.ts:42
**Body**:
_⚠️ Potential issue_ | _🔴 Critical_

**重大バグ: 文字ホワイトリストに `a`, `c`, `d`, `e`, `f`, `g`, `h` が不足しています。**

正規表現 `/^[0-9rnbqkpRNBQKPw/\s-]+$/` は FEN で必要な文字の一部が欠落しています。

具体的に不足している文字:

- **アンパッサン目標マス**: `a3`, `c6`, `e3`, `f6` 等の表記に `a`, `c`, `d`, `e`, `f`, `g`, `h` が必要
- **アクティブカラー**: `b`（黒手番）は駒文字 `b` でカバーされますが、偶然の一致に依存

結果として、以下のような**完全に有効な FEN** が `SECURITY_ERROR` で拒否されます:

```
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
```

（`e3` の `e` がホワイトリストに含まれないため）

また、remediation メッセージ（23行目）では `[a-z], [A-Z]` と記載されており、実際の正規表現よりも広い範囲を示唆しているため矛盾しています。

<details>
<summary>🐛 修正案</summary>

```diff
-  if (!/^[0-9rnbqkpRNBQKPw/\s-]+$/.test(trimmedPos)) {
+  if (!/^[0-9a-hA-Hw/\s-]+$/.test(trimmedPos)) {
```

あるいは、remediation メッセージに合わせてより寛容に:

```diff
-  if (!/^[0-9rnbqkpRNBQKPw/\s-]+$/.test(trimmedPos)) {
+  if (!/^[0-9a-zA-Z/\s-]+$/.test(trimmedPos)) {
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/domains/chess/index.ts` around lines 18 - 25, The whitelist
regex used to validate trimmedPos is missing lowercase file letters (a-h) and
other valid FEN characters, causing valid FENs (e.g., en passant squares like
"e3") to be rejected; update the regex in the validation (the
/^[0-9rnbqkpRNBQKPw/\s-]+$/ check for trimmedPos) to include all required
characters (lowercase a-h and any other FEN tokens you intend to allow) and make
the EngineError message/remediation (EngineError with code
EngineErrorCode.SECURITY_ERROR) consistent with the new regex — ensure the
remediation text matches the actual allowed set.
```

</details>

<!-- fingerprinting:phantom:medusa:phoenix -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825083695

**User**: coderabbitai[bot]
**Path**: packages/ui-react/src/**tests**/ChessBoard.test.tsx:15
**Body**:
_⚠️ Potential issue_ | _🔴 Critical_

<details>
<summary>🧩 Analysis chain</summary>

🏁 Script executed:

```shell
#!/bin/bash
# Find the ChessBoard test file and read it
find . -name "ChessBoard.test.tsx" -type f
```

Repository: hdkz-dev/multi-game-engines

Length of output: 124

---

🏁 Script executed:

```shell
#!/bin/bash
# Find the ChessBoard component index.tsx
find . -path "*/ui-react/src/*" -name "index.tsx" -type f
```

Repository: hdkz-dev/multi-game-engines

Length of output: 150

---

🏁 Script executed:

```shell
#!/bin/bash
# Search for custom element definition patterns
rg -n "customElements.define" --type=ts -A 2 -B 2
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
#!/bin/bash
# Search for chess-board or mg-chess-board tag usage
rg -n "chess-board|mg-chess-board" --type=ts --type=tsx
```

Repository: hdkz-dev/multi-game-engines

Length of output: 98

---

🏁 Script executed:

```shell
#!/bin/bash
# Read the test file to see full context
cat -n "./packages/ui-react/src/__tests__/ChessBoard.test.tsx"
```

Repository: hdkz-dev/multi-game-engines

Length of output: 809

---

🏁 Script executed:

```shell
#!/bin/bash
# Read the chess component index file to see what element is rendered
cat -n "./packages/ui-react/src/chess/index.tsx"
```

Repository: hdkz-dev/multi-game-engines

Length of output: 3428

---

🏁 Script executed:

```shell
#!/bin/bash
# Search for custom element definitions (trying different approach)
rg "customElements\.define|<chess-board|<mg-chess-board" -A 2
```

Repository: hdkz-dev/multi-game-engines

Length of output: 5742

---

</details>

**テストが常にパスする空振りアサーション ― 致命的な正確性バグ**

2つの問題が重なってこのテストを完全な無効コードにしています。

1. **セレクタ名の不一致**: `document.querySelector("mg-chess-board")` を使っていますが、`ChessBoard` コンポーネント（`packages/ui-react/src/chess/index.tsx` Line 82）は `<chess-board>` をレンダリングします。`mg-chess-board` 要素は DOM 上に存在しないため、`el` は常に `null` になります。

2. **アサーション手法の誤り**: `toBeDefined()` は値が `undefined` でないことを検査します。 `null` は `undefined` ではないため `expect(null).toBeDefined()` は**常に成功**します。つまり、コンポーネントが何もレンダリングしなくても、このテストは通過してしまいます。

<details>
<summary>修正案</summary>

```diff
-    const el = document.querySelector("mg-chess-board");
-    expect(el).toBeDefined();
+    expect(document.querySelector("chess-board")).not.toBeNull();
```

</details>

<!-- suggestion_start -->

<details>
<summary>📝 Committable suggestion</summary>

> ‼️ **IMPORTANT**
> Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

```suggestion
    expect(document.querySelector("chess-board")).not.toBeNull();
```

</details>

<!-- suggestion_end -->

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/ui-react/src/__tests__/ChessBoard.test.tsx` around lines 14 - 15,
The test in ChessBoard.test.tsx is using the wrong selector and a weak
assertion: change the selector from "mg-chess-board" to "chess-board" to match
the ChessBoard component's rendered tag, and replace expect(el).toBeDefined()
with a proper presence check such as expect(el).not.toBeNull() (or use
testing-library's expect(el).toBeInTheDocument() if you render via
`@testing-library/react`). Ensure you locate the query in the test file and update
the assertion accordingly so the test actually fails when the component is not
rendered.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825083699

**User**: coderabbitai[bot]
**Path**: packages/ui-react/src/**tests**/ShogiBoard.test.tsx:14
**Body**:
_⚠️ Potential issue_ | _🔴 Critical_

**テストが常にパスする偽陽性バグ: セレクタ不一致 + アサーション誤り**

2つの問題が組み合わさり、このテストは要素の存在を実際には検証できていません：

1. **セレクタの不一致** (Line 13): コンポーネントは `<shogi-board>` をレンダリングしますが（`index.tsx` Line 87、IntrinsicElements の宣言も `"shogi-board"`）、テストでは `"mg-shogi-board"` をクエリしています。要素が見つからず `null` が返されます。

2. **アサーションの誤り** (Line 14): `expect(el).toBeDefined()` は `null` に対しても通過します。`querySelector` は要素が見つからない場合 `null` を返しますが、`null !== undefined` なので `toBeDefined()` は常に成功します。

結果として、このテストはコンポーネントが正しくレンダリングされるかどうかに関係なく常にパスします。

<details>
<summary>🐛 修正案</summary>

```diff
-    const el = document.querySelector("mg-shogi-board");
-    expect(el).toBeDefined();
+    const el = document.querySelector("shogi-board");
+    expect(el).not.toBeNull();
```

または `@testing-library/jest-dom` を使用する場合：

```diff
-    const el = document.querySelector("mg-shogi-board");
-    expect(el).toBeDefined();
+    const el = document.querySelector("shogi-board");
+    expect(el).toBeInTheDocument();
```

</details>

注意: 正しいタグ名はカスタム要素の登録名に依存します。上記コメントの検証スクリプトで `customElements.define` の登録タグ名を確認してください。

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/ui-react/src/__tests__/ShogiBoard.test.tsx` around lines 12 - 14,
The test is a false-positive because it queries the wrong tag name and uses an
inappropriate assertion: update the selector in the ShogiBoard test (where
render(<ShogiBoard sfen={sfen} />) is called) to match the real custom element
tag registered (replace "mg-shogi-board" with the actual tag, e.g.,
"shogi-board" as registered via customElements.define) and change the assertion
from expect(el).toBeDefined() to a strict presence check such as
expect(el).not.toBeNull() or, if using `@testing-library/jest-dom`,
expect(el).toBeInTheDocument(); also verify the registered tag name in the
component/registration code (customElements.define) if unsure.
```

</details>

<!-- fingerprinting:phantom:medusa:phoenix -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140274

**User**: coderabbitai[bot]
**Path**: docs/implementation*plans/extended-adapters-design.md:89
**Body**:
*⚠️ Potential issue* | *🟡 Minor\_

<details>
<summary>🧩 Analysis chain</summary>

🌐 Web query:

`UCCI protocol official specification Xiangqi position notation FEN`

💡 Result:

### Official UCCI specification (protocol + how positions are sent)

The closest thing to an “official” UCCI spec that is widely treated as canonical is the **XQBase “中国象棋电脑应用规范(五)：中国象棋通用引擎协议”** page. It defines (among other commands) how a GUI sends a position to an engine:

- `position { fen <fen_str> | startpos } [moves <move_list>]`
- `startpos` is defined as equivalent to the Xiangqi start FEN:  
  `rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1`
- UCCI also specifies that because plain FEN cannot encode repetition/“long check” history, GUIs should append a `moves ...` list (and often use a “base” FEN from the last capture / start position, then list subsequent moves) to preserve the needed history. [1]

### Xiangqi FEN position notation (as used with UCCI `position fen ...`)

XQBase’s **“中国象棋电脑应用规范(三)：FEN文件格式”** defines the Xiangqi FEN string used by UCCI and gives examples in the exact `... w - - 0 1` style above. It also explicitly notes the limitation of FEN for history and the need for `moves` in UCCI. [2]

In practice, Xiangqi FEN in UCCI follows standard FEN’s 6-field structure (piece placement / side to move / … / move counters), but Xiangqi typically uses `- -` for the chess-specific castling and en-passant fields. [5][2]

**Piece letters commonly used in Xiangqi FEN (UCCI ecosystem):**

- `k` general (king), `a` advisor, `b` elephant (bishop), `n` horse (knight), `r` chariot (rook), `c` cannon, `p` pawn; uppercase for Red. [3][4]

**Board encoding:**

- 10 ranks separated by `/`, digits `1`–`9` compress consecutive empty points (since a Xiangqi rank has 9 files). [3]

**Example (start position, Red to move):**  
`rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1` [1][2]

**Sources:**  
[1] XQBase – 中国象棋电脑应用规范(五)：中国象棋通用引擎协议 (UCCI)  
[2] XQBase – 中国象棋电脑应用规范(三)：FEN文件格式  
[3] Super Web Chinese Chess – FEN format (piece letters + rank structure notes)  
[4] Crowded Xiangqi – notes the `krncabp` mapping used in Xiangqi FEN contexts  
[5] Wikipedia – Forsyth–Edwards Notation (standard 6-field definition)

---

🌐 Web query:

`WEN Xiangqi FEN standard notation chess variant`

💡 Result:

There isn’t a widely used **“WEN”**-specific FEN standard for Xiangqi; the de‑facto standard is simply **FEN adapted to Xiangqi**, using **WXF piece letters**. ([chessprogramming.org](https://www.chessprogramming.org/Chinese_Chess))

## Xiangqi FEN (de‑facto)

**Format (same 6 fields as chess FEN):**  
`<board> <side-to-move> - - <halfmove> <fullmove>`  
(Xiangqi doesn’t use castling or en‑passant, so those fields are typically `- -`.) ([chessprogramming.org](https://www.chessprogramming.org/Chinese_Chess))

### Piece letters (WXF)

- **K** King/General, **A** Advisor, **E** Elephant, **R** Rook/Chariot, **C** Cannon, **H** Horse, **P** Pawn  
  Uppercase = Red, lowercase = Black. ([yumpu.com](https://www.yumpu.com/en/document/view/19170346/fen-for-xiangqi-chinese-chess-))

### Starting position (commonly used)

```
rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w - - 0 1
```

([chessprogramming.org](https://www.chessprogramming.org/Chinese_Chess))

Citations:

- 1: https://www.chessprogramming.org/Chinese_Chess
- 2: https://www.chessprogramming.org/Chinese_Chess
- 3: https://www.yumpu.com/en/document/view/19170346/fen-for-xiangqi-chinese-chess-
- 4: https://www.chessprogramming.org/Chinese_Chess

---

🌐 Web query:

`UCCI "position fen" command Xiangqi specification`

💡 Result:

In **UCCI (Universal Chinese Chess Interface)**, the command to set a Xiangqi position using FEN is:

- `position fen <fen_string> [moves <move1> <move2> ...]`
- or `position startpos [moves ...]` where `startpos` is equivalent to the standard initial Xiangqi FEN. ([xqbase.com](https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai))

### What `position fen` means (UCCI-specific details)

1. **`<fen_string>` is a Xiangqi FEN** (10 ranks, separated by `/`), followed by fields like side-to-move (`w`/`b`) and then typically `- - 0 1` (castling/en-passant are unused in Xiangqi but kept for compatibility). Example from the UCCI spec:  
   `position fen rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1` ([xqbase.com](https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai))

2. **`moves ...` is how UCCI conveys history** (important for repetition / perpetual-check rules). Because FEN alone is a snapshot, UCCI commonly sends a “base” FEN (often the position after the last capture, or the start position) and then appends all subsequent moves via `moves`. ([xqbase.com](https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai))

3. **Move coordinate notation (UCCI):** moves are in coordinate form like `b0c2`, using files `a`–`i` and ranks `0`–`9` (i.e., ranks are 0-based). ([xqbase.com](https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai))

Citations:

- 1: https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai
- 2: https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai
- 3: https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai
- 4: https://www.xqbase.com/protocol/cchess_ucci.htm?utm_source=openai

---

</details>

**UCCI 仕様では「FEN」を使用します。「WEN」は公式な用語ではありません**

UCCI プロトコルの公式仕様（XQBase・中国象棋通用引擎協議）では、局面指定に `position fen <fen_string>` コマンドを使用し、Xiangqi 用の FEN 表記を採用しています。「WEN」という用語は UCCI 標準仕様に存在しないため、実装者が混乱する可能性があります。

チェスの FEN と同じ 6 フィールド構造を持ち、駒表記のみが異なります（例：`rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1`）。

<details>
<summary>修正案</summary>

```diff
-- **特徴**: UCI に極めて近いが、FEN ではなく WEN (Xiangqi Fen) を使用。
+- **特徴**: UCI に極めて近いが、チェス FEN と構造は同一で駒表記のみ異なる Xiangqi FEN を使用。
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@docs/implementation_plans/extended-adapters-design.md` at line 89, Update the
wording that currently says "WEN (Xiangqi Fen)" to use the official UCCI/XQBase
term "FEN" and reference the UCCI position command semantics (i.e., use
"position fen <fen_string>"); remove any mention of "WEN" as a separate standard
term, note that Xiangqi uses a FEN-like string with Xiangqi piece notation
(e.g., the example fen `rnbakabnr/9/1c5c1/...`), and ensure the sentence in the
file that begins "**特徴**: UCI に極めて近いが、FEN ではなく WEN (Xiangqi Fen) を使用。" is
changed to reflect that UCCI uses FEN (not "WEN") and how to supply it via
`position fen <fen_string>`.
```

</details>

<!-- fingerprinting:phantom:triton:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140278

**User**: coderabbitai[bot]
**Path**: packages/adapter-gtp/src/**tests**/GTPAdapter.test.ts:56
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**`vi.stubGlobal` のクリーンアップ漏れ — テスト汚染のリスク**

`vi.stubGlobal` で設定したグローバル変数は、`unstubGlobals` オプションを有効にするか `vi.unstubAllGlobals()` を呼び出さない限り、テスト間で自動リセットされません。 `afterAll` の `vi.restoreAllMocks()` は `vi.spyOn` モックのみを対象としており、`vi.stubGlobal` で変更したグローバル値は `vi.unstubAllGlobals()` を呼び出すことで元の値に戻すことができます。

このため、`Worker` グローバルが `MockWorker` のまま残り、後続のテストファイルに影響する可能性があります。

<details>
<summary>🛡️ 修正案</summary>

```diff
   afterAll(() => {
     vi.restoreAllMocks();
+    vi.unstubAllGlobals();
   });
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/adapter-gtp/src/__tests__/GTPAdapter.test.ts` around lines 46 - 56,
The tests stub the global Worker via vi.stubGlobal(MockWorker) in beforeEach but
only call vi.restoreAllMocks() in afterAll, leaving the global Worker overridden
across other tests; update cleanup to call vi.unstubAllGlobals() (or enable
unstubGlobals option) in the teardown (e.g., in afterAll or afterEach) so the
global set by vi.stubGlobal("Worker", MockWorker) is restored to its original
value and prevents test pollution.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140280

**User**: coderabbitai[bot]
**Path**: packages/core/src/bridge/EngineLoader.ts:252
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

<details>
<summary>🧩 Analysis chain</summary>

🏁 Script executed:

```shell
cd /tmp && find . -name "EngineLoader.ts" -type f 2>/dev/null | head -5
```

Repository: hdkz-dev/multi-game-engines

Length of output: 53

---

🏁 Script executed:

```shell
git ls-files packages/core/src/bridge/ | grep -i engineloader
```

Repository: hdkz-dev/multi-game-engines

Length of output: 166

---

🏁 Script executed:

```shell
cat -n packages/core/src/bridge/EngineLoader.ts | head -100
```

Repository: hdkz-dev/multi-game-engines

Length of output: 4036

---

🏁 Script executed:

```shell
cat -n packages/core/src/bridge/EngineLoader.ts | sed -n '200,280p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 1945

---

🏁 Script executed:

```shell
cat -n packages/core/src/bridge/EngineLoader.ts | sed -n '1,100p'
```

Repository: hdkz-dev/multi-game-engines

Length of output: 4036

---

🏁 Script executed:

```shell
cat -n packages/core/src/bridge/EngineLoader.security.test.ts
```

Repository: hdkz-dev/multi-game-engines

Length of output: 3375

---

🏁 Script executed:

```shell
rg -n "loopback|localhost|production|validateWorkerUrl" packages/core/src/bridge/ -A 3
```

Repository: hdkz-dev/multi-game-engines

Length of output: 3830

---

</details>

**ループバック URL からの Worker 読み込みは本番環境でも許可されています**

`validateWorkerUrl` の `!isLoopback` 条件（Line 235）により、ループバックアドレス（`localhost`, `127.0.0.1` 等）はクロスオリジンチェックを免除されます。テストケース（`EngineLoader.security.test.ts:60-63`）で「`should allow exact localhost`」と明示されており、この動作は意図的な設計です。

しかし、`loadResource` で計算される `isProduction` フラグ（Line 72-74）が `validateWorkerUrl` に伝達されていないため、本番環境での環境別制御が不可能です。現在のコードでは、本番の HTTPS ページ（例: `https://prod.example.com`）から `http://localhost:8080/worker.js` を読み込むことができます。

SRI 検証が必須（Lines 76-82）であるため完全な穴ではありませんが、開発環境と本番環境で異なるセキュリティポリシーを適用したい場合は、以下の対応が必要です：

- 本番環境でループバック読み込みを禁止する場合：`isProduction` を `validateWorkerUrl` に渡し、本番での localhost はエラーにする
- または明確な設計ドキュメントで「ループバック許可は開発/テスト環境向けの仕様」と記載し、本番での使用を禁止する旨を明記する

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/bridge/EngineLoader.ts` around lines 226 - 252, The
validateWorkerUrl method currently treats loopback hosts as exempt from
cross-origin checks; pass the environment flag from loadResource (the computed
isProduction) into validateWorkerUrl and update its logic to reject loopback
hosts when isProduction is true. Specifically, add an isProduction boolean
parameter to validateWorkerUrl and, when isProduction === true, remove the
!isLoopback bypass so that URLs with hostname localhost/127.0.0.1/::1 are
treated as cross-origin and cause an EngineError
(EngineErrorCode.SECURITY_ERROR) similar to the existing non-origin branch; keep
existing behavior when isProduction is false to preserve tests that allow
localhost. Ensure calls to validateWorkerUrl (e.g., from loadResource) are
updated to pass the isProduction value.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140285

**User**: coderabbitai[bot]
**Path**: packages/core/src/domains/chess/index.ts:85
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**キャスリング正規表現が重複文字・不正な順序を許可します。**

`/^(-|[KQkq]+)$/` は `KKKK` や `qKQk` のような無効な文字列を通過させます。FEN 仕様では各文字は最大 1 回・`KQkq` の順序で現れる必要があります。

<details>
<summary>🐛 修正案</summary>

```diff
-  if (!/^(-|[KQkq]+)$/.test(castling!)) {
+  if (!/^(-|K?Q?k?q?)$/.test(castling!) || (castling !== "-" && castling!.length === 0)) {
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/domains/chess/index.ts` around lines 80 - 85, The current
validation using /^(-|[KQkq]+)$/ allows duplicates and wrong order for the
castling string; update the validation around the castling variable used in this
check to allow only "-" or a sequence that is a subset of "KQkq" in that exact
order with no repeats (e.g., use a stricter pattern or explicit check), and keep
throwing EngineError with EngineErrorCode.VALIDATION_ERROR and the same message
when it fails; locate the castling validation block (the if that throws
EngineError) and replace the regex-based test with one that enforces K?Q?k?q?
ordering or an equivalent algorithm that ensures each of 'K','Q','k','q' appears
at most once and in that order.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140288

**User**: coderabbitai[bot]
**Path**: packages/core/src/domains/chess/index.ts:101
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**手数フィールドの値域チェックが不完全です。**

`isNaN(Number(...))` のみでは負の値（`-1` 等）が通過します。FEN 仕様では半手数クロック（`halfMove`）は `>= 0`、全手数カウンター（`fullMove`）は `>= 1` であるべきです。

<details>
<summary>🐛 修正案</summary>

```diff
-  if (isNaN(Number(halfMove)) || isNaN(Number(fullMove))) {
+  const halfMoveNum = Number(halfMove);
+  const fullMoveNum = Number(fullMove);
+  if (
+    !Number.isInteger(halfMoveNum) || halfMoveNum < 0 ||
+    !Number.isInteger(fullMoveNum) || fullMoveNum < 1
+  ) {
     throw new EngineError({
       code: EngineErrorCode.VALIDATION_ERROR,
       message: "Invalid move counters: must be numeric.",
     });
   }
```

</details>

<!-- suggestion_start -->

<details>
<summary>📝 Committable suggestion</summary>

> ‼️ **IMPORTANT**
> Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

```suggestion
  const halfMoveNum = Number(halfMove);
  const fullMoveNum = Number(fullMove);
  if (
    !Number.isInteger(halfMoveNum) || halfMoveNum < 0 ||
    !Number.isInteger(fullMoveNum) || fullMoveNum < 1
  ) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid move counters: must be numeric.",
    });
  }
```

</details>

<!-- suggestion_end -->

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/domains/chess/index.ts` around lines 96 - 101, The current
validation using isNaN(Number(halfMove)) / isNaN(Number(fullMove)) lets negative
and non-integer values slip through; update the check around the
halfMove/fullMove validation (the block that throws EngineError with
EngineErrorCode.VALIDATION_ERROR) to ensure both are numeric integers and within
FEN bounds: halfMove must be >= 0 and fullMove must be >= 1 (and you may also
enforce integer-ness via Number.isInteger or equivalent after coercion). If the
check fails, keep throwing an EngineError with a clear message mentioning the
required ranges for halfMove (>=0) and fullMove (>=1).
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140289

**User**: coderabbitai[bot]
**Path**: packages/core/src/domains/shogi/index.ts:49
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**`fields.length < 4` は余剰フィールドを持つ不正な SFEN を通過させます。**

SFEN は FEN を将棋用に拡張したフォーマットで、キャスリング・アンパッサン・半手数クロックの代わりに持ち駒フィールドが追加された、正確に **4 フィールド** の構造です。`< 4` では 5 フィールド以上の入力が検証をパスし、余剰フィールドがサイレントに無視されます。`!== 4` に修正してください。

<details>
<summary>🐛 修正案</summary>

```diff
-  if (fields.length < 4) {
+  if (fields.length !== 4) {
     throw new EngineError({
       code: EngineErrorCode.VALIDATION_ERROR,
-      message: `Invalid SFEN structure: Expected 4 fields, found ${fields.length}`,
+      message: `Invalid SFEN structure: Expected exactly 4 fields, found ${fields.length}`,
     });
   }
```

</details>

<!-- suggestion_start -->

<details>
<summary>📝 Committable suggestion</summary>

> ‼️ **IMPORTANT**
> Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

```suggestion
  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 4) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN structure: Expected exactly 4 fields, found ${fields.length}`,
    });
  }
```

</details>

<!-- suggestion_end -->

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/domains/shogi/index.ts` around lines 43 - 49, The SFEN
validation currently accepts inputs with extra fields because it checks
"fields.length < 4"; change this to require exactly four fields by checking
"fields.length !== 4". Update the validation around trimmedPos and fields so
that when fields length is not exactly 4 you throw the existing EngineError
using EngineErrorCode.VALIDATION_ERROR and the same message (adjusting the
phrase to say "Expected exactly 4 fields" if you prefer) to ensure inputs with
5+ fields are rejected.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140291

**User**: coderabbitai[bot]
**Path**: packages/core/src/domains/shogi/index.ts:84
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**手数フィールドに 0 以下の値が通過します。**

`Move count` は現在の手数を表す整数であり、USI プロトコルでは国際的なプレイヤーが「プライ」または「半手」と呼ぶ単位でカウントします。 初期局面の標準 SFEN 例では手数フィールドは `1` です。

`isNaN(Number(moveCount))` のみでは `0` や `-1` のような不正値が通過します。`>= 1` の整数チェックを追加してください。

<details>
<summary>🐛 修正案</summary>

```diff
-  if (isNaN(Number(moveCount))) {
+  const moveNum = Number(moveCount);
+  if (!Number.isInteger(moveNum) || moveNum < 1) {
     throw new EngineError({
       code: EngineErrorCode.VALIDATION_ERROR,
       message: `Invalid move count: "${moveCount}"`,
     });
   }
```

</details>

<!-- suggestion_start -->

<details>
<summary>📝 Committable suggestion</summary>

> ‼️ **IMPORTANT**
> Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

```suggestion
  const moveNum = Number(moveCount);
  if (!Number.isInteger(moveNum) || moveNum < 1) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid move count: "${moveCount}"`,
    });
  }
```

</details>

<!-- suggestion_end -->

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@packages/core/src/domains/shogi/index.ts` around lines 79 - 84, The current
validation only checks isNaN(Number(moveCount)) and allows 0 or negative values;
update the check for moveCount to parse it as a number (e.g., Number or
parseInt), verify Number.isInteger(parsed) and parsed >= 1, and if the check
fails throw the same EngineError with EngineErrorCode.VALIDATION_ERROR and
message `Invalid move count: "${moveCount}"`; modify the validation surrounding
moveCount (the block that currently constructs the EngineError) to enforce the
>= 1 integer requirement.
```

</details>

<!-- fingerprinting:phantom:poseidon:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---

### Comment ID: 2825140292

**User**: coderabbitai[bot]
**Path**: README.md:64
**Body**:
_⚠️ Potential issue_ | _🟡 Minor_

**`import` 文が実行コードの後に配置されており、無効な TypeScript です**

行 59 の `import { createFEN }` は `bridge.registerAdapter()`、`engine.load()`、`engine.onInfo()` といった実行文より後に置かれています。TypeScript (および ESM) では `import` 宣言はモジュールのトップレベルに記述する必要があり、実行文の後に記述すると `An import declaration can only be used at the top level of a module` というエラーになります。このままコードをコピーしたユーザーは即座にエラーに遭遇します。`createFEN` のインポートを行 42〜43 の既存インポート群の直後に移動してください。

<details>
<summary>📝 修正案</summary>

```diff
 import { EngineBridge } from "@multi-game-engines/core";
 import { StockfishAdapter, FEN } from "@multi-game-engines/adapter-stockfish";
+import { createFEN } from "@multi-game-engines/core/chess";

 const bridge = new EngineBridge();
 // registerAdapter は非同期メソッドです
 await bridge.registerAdapter(new StockfishAdapter());

 // アダプターをインポートしていれば、EngineRegistry により型推論が自動的に働きます
 const engine = bridge.getEngine("stockfish");
 await engine.load();

 // 思考状況の購読 (アダプター固有の型が適用されます)
 engine.onInfo((info) => {
   console.log(`Depth: ${info.depth}, Score: ${info.score}`);
 });

 // 探索の実行 (startpos キーワードもサポート)
-import { createFEN } from "@multi-game-engines/core/chess";
-
-// ...
-
 const fen = createFEN("startpos");
 const result = await engine.search({ fen });
 console.log(`Best Move: ${result.bestMove}`);
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@README.md` around lines 59 - 64, The import declaration for createFEN is
placed after executable statements (bridge.registerAdapter, engine.load,
engine.onInfo), which is invalid in TypeScript/ESM; move the line "import {
createFEN } from '@multi-game-engines/core/chess';" into the top-level import
block together with the existing imports (i.e. immediately after the other
import statements) so createFEN is declared before any runtime code like
bridge.registerAdapter, engine.load, or engine.onInfo.
```

</details>

<!-- fingerprinting:phantom:triton:churro -->

<!-- This is an auto-generated comment by CodeRabbit -->

---
