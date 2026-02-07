# ADR-018: アダプターのメタデータと状態の分離 (Metadata and State Separation)

## ステータス

承認済み

## コンテキスト

以前の設計では、`IEngineAdapterInfo` インターフェースに、静的な情報（ID、名称、バージョン、ライセンス）と動的な状態（ステータス、進捗状況）の両方が混在していました。

これにより、以下の問題が発生していました：

1. **静的定義の汚染**: `stockfishMetadata` などの定数を定義する際、実行時まで確定しないはずの `status: "idle"` などをダミーとして含める必要があった。
2. **責務の混在**: 「エンジンの種類としての情報」と「特定のエンジンインスタンスの状態」が同一のオブジェクトとして扱われ、シリアライズや表示ロジックにおいて不必要な情報が含まれる原因となった。
3. **型安全性の低下**: 静的な情報のみを必要とする場所で、ランタイム状態を無視またはモックする必要があり、直感的ではない実装を招いていた。

## 決定

`IEngineAdapterInfo` を以下の 2 つのインターフェースに分離し、それらの交差型として再定義します。

1. **`IEngineAdapterMetadata`**: 静的なメタデータのみを保持（id, name, version, engineLicense, adapterLicense, sources）。
2. **`IEngineAdapterState`**: 動的なランタイム状態のみを保持（status, progress）。
3. **`IEngineAdapterInfo`**: 上記 2 つを継承した統合インターフェース。

これにより、アダプターの実装クラスやメタデータ定数は、適切なインターフェースを個別に実装できるようになります。

```typescript
// packages/core/src/types.ts

export interface IEngineAdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly engineLicense: ILicenseInfo;
  readonly adapterLicense: ILicenseInfo;
  readonly sources?: Record<string, IEngineSourceConfig>;
}

export interface IEngineAdapterState {
  readonly status: EngineStatus;
  readonly progress: ILoadProgress;
}

export interface IEngineAdapterInfo
  extends IEngineAdapterMetadata, IEngineAdapterState {}
```

## 結果

- **クリーンな定数定義**: 静的メタデータ定数から、ダミーのランタイム状態を排除できた。
- **明確なセマンティクス**: メタデータ（不変）と状態（可変）の区別が型レベルで明確になった。
- **将来の拡張性**: メタデータのみのリスト表示や、状態のみのシリアライズなどが容易になった。
