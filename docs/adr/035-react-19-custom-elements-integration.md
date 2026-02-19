# ADR-035: React 19 におけるカスタム要素とプロパティの統合パターン (React 19 Custom Elements Property Integration Pattern)

## 状況 (Context)

React 19 ではカスタム要素（Web Components）のサポートが大幅に改善され、多くのプロパティが標準的な HTML 属性として自動的にマッピングされるようになりました。しかし、JSDOM 環境下でのテストや、複雑なオブジェクト型のプロパティ（`pieceNames` 等）、および Lit 要素側の `reflect: true` 設定との兼ね合いにおいて、依然としてプロパティが正しく反映されない、あるいはテストで期待値が取得できないといった課題が発生しました。

## 決定 (Decision)

カスタム要素を React 19 でラップする際、以下の 3 段階の統合パターンを標準として採用します。

1. **基本属性のマッピング (Declarative Support)**:
   - プリミティブな値（`fen`, `orientation`, `locale` 等）については、JSX の属性として直接記述します。React 19 の標準機能により、これらは適切に処理されます。
2. **プロパティの明示的な reflec 設定 (Lit side)**:
   - カスタム要素側（Lit）の `@property` において、テストの観測性向上のため `reflect: true` を明示的に付与します。これにより、プロパティの変更が DOM 属性に同期され、`getAttribute` による検証が可能になります。
3. **複雑な型のマニュアル・プロパティ設定 (Imperative Support)**:
   - `pieceNames` のような非プリミティブなプロパティ、または JSDOM 環境で属性同期が不安定なプロパティについては、`useLayoutEffect` を用いて DOM 要素のインスタンスに対してマニュアルで値を代入します。
   - これにより、型安全性を維持しつつ、React のレンダリングサイクルとカスタム要素の内部状態を確実に同期させます。

```typescript
// 推奨される実装パターン
export const MyBoard: React.FC<Props> = ({ pieceNames, ...props }) => {
  const ref = useRef<MyElement>(null);

  useLayoutEffect(() => {
    if (ref.current && pieceNames) {
      ref.current.pieceNames = pieceNames;
    }
  }, [pieceNames]);

  return <my-board ref={ref} {...props} />;
};
```

## 結末 (Consequences)

- **メリット**:
  - React 19 の恩恵を受けつつ、エッジケース（非プリミティブ型、JSDOM テスト）における堅牢性を確保。
  - カスタム要素側の `reflect: true` により、E2E テストや CSS セレクタによるスタイリングが容易になる。
- **デメリット**:
  - `useLayoutEffect` によるマニュアル設定が必要な分、純粋な宣言的記述に比べるとコード量が増える。
  - レンダリングのタイミング（`updateComplete`）を考慮した非同期テストが必要。
