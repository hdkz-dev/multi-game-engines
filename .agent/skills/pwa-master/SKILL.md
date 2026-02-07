---
name: pwa-master
description: モバイルアプリ化（PWA/TWA）とリリース準備を支援するスキル
---

# PWA Master Skill

このスキルは、Web アプリケーションを高品質な PWA (Progressive Web App) およびネイティブアプリ（TWA 経由）としてリリースするための準備、設定、検証を支援します。

## 主な機能

1.  **Manifest Optimization (マニフェスト最適化)**

    - `manifest.json` の設定項目（`name`, `short_name`, `icons`, `start_url`, `display` 等）が、iOS/Android 両方のベストプラクティスに沿っているか検証します。
    - 特に「マスク可能なアイコン (`maskable`)」の設定や、スプラッシュスクリーンの設定を確認します。

2.  **Asset Generation (アセット生成)**

    - `canvas-design` スキルや画像生成ツールと連携し、必要な全サイズのアイコン（iOS 用、Android 用、ストア用スクリーンショット）の生成を支援します。
    - ファビコン生成や、`apple-touch-icon` の設定確認も行います。

3.  **Service Worker Strategy (オフライン対応)**

    - `next-pwa` やカスタム Service Worker の設定を確認し、適切なキャッシュ戦略（Stale-While-Revalidate 等）が適用されているかチェックします。
    - オフライン時のフォールバックページが設定されているか確認します。

4.  **TWA / Native Wrapper Support**
    - Android (Bubblewrap) や iOS (Capacitor/Swift) でのラップ作業に必要な設定ファイルや手順を提供します。
    - 署名鍵（Keystore）の管理や、ビルドプロセスのガイドラインを示します（ただし、実際の署名ファイルは git に含めないよう注意を促します）。

## 検証リスト (Lighthouse PWA Check)

リリース前には必ず以下を確認するよう促します：

- [ ] HTTPS で配信されているか
- [ ] オフラインでもページが表示されるか（200 OK）
- [ ] マニフェストが正しく読み込まれているか
- [ ] アイコンが適切なサイズで設定されているか
- [ ] モバイルフレンドリーなビューポート設定か

## 使用例

- 「PWA のアイコンを作って」
- 「マニフェストファイルを確認して」
- 「モバイルアプリとしてビルドする準備をして」
