# ADR-037: Core とドメイン（Chess/Shogi等）の物理的隔離とライフサイクル堅牢化

## ステータス

承認済み (Accepted) - 2026-02-20

## コンテキスト

Zenith Tier（最高品質標準）への最終調整において、以下の課題が浮き彫りになった：

1. **ドメイン知識の染み出し**: Core パッケージにチェスの FEN や将棋の SFEN に関する具体的なバリデーションロジックや型定義が残留しており、疎結合性が損なわれていた。
2. **ライフサイクルの不備**: `EngineBridge` の破棄（dispose）プロセス中に非同期の初期化が完了した場合、破棄後のインスタンスにアクセスできてしまう可能性（TOCTOU）があった。
3. **セキュリティ境界の曖昧性**: 入力形式の不備（Validation Error）と悪意ある注入試行（Security Error）の区別が曖昧であり、Refuse by Exception パターンの適用が不十分だった。

## 意思決定

### 1. ドメイン知識の Core からの完全排除

- `core` パッケージから `FEN`, `SFEN` の型定義、および `createFEN`, `createSFEN` などのファクトリ関数を完全に削除した。
- これらはそれぞれのドメインパッケージ（`domain-chess`, `domain-shogi`）に委譲され、Core は汎用的な `PositionString`（ブランド型）の基盤のみを提供する。

### 2. EngineBridge のアトミックなライフサイクル管理

- `EngineBridge` の非同期初期化ラムダ内に、能力検証前とインスタンス登録前の 2 段階で `disposed` チェックを追加した。
- ブリッジが破棄された後に、進行中だった Promise が古いキャッシュを汚染することを物理的に防止した。

### 3. セキュリティ例外への格上げ

- すべてのドメイン固有の局面・指し手バリデーションにおける失敗を `SECURITY_ERROR` へと格上げした。
- これにより、不正な文字列（プロトコル違反）の混入を単なる「入力ミス」ではなく「信頼境界の突破試行」として一貫して処理する（Zero-Any & Refuse by Exception Policy）。

### 4. EngineLoader の SSRF 対策強化

- 本番環境において、ループバックアドレス（localhost）へのリクエストを明示的に拒否するように修正した。

## 影響

- **ポジティブ**: アーキテクチャの純粋性が高まり、新しいゲームルール（囲碁、オセロ等）の追加時に Core を変更する必要がなくなった。
- **ポジティブ**: 非同期競合によるメモリリークや未定義挙動が構造的に解消された。
- **ネガティブ**: ドメイン固有の型を使用する場合、Core だけでなく該当する Domain パッケージを明示的にインポートする必要がある。

### 5. Zenith Tier Refinements (2026 Standards)

- **Environment Diagnostics**: `EnvironmentDiagnostics` を導入し、WASM Threads に必須な COOP/COEP ヘッダーの状態を検証・警告。
- **Resource Revocation**: `EngineLoader.revokeByEngineId` を導入し、ブリッジ破棄時に Blob URL を解放。
- **Binary Transfer Optimization**: `BaseAdapter` において `Uint8Array` コマンドの Transferable 指定によるゼロコピー通信。

## 意思決定の結果 (Consequences)

- **メリット**: 極めて高い安全性、予測可能なライフサイクル、最新ブラウザ機能の最大限の活用。
- **メリット**: メモリ効率の向上。
- **トレードオフ**: 型定義管理のコストが僅かに増加するが、堅牢性は劇的に向上する。
