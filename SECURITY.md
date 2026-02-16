# セキュリティポリシー / Security Policy

## サポート対象のバージョン / Supported Versions

現在、以下のバージョンに対してセキュリティアップデートを提供しています。

We currently provide security updates for the following versions:

| バージョン / Version | サポート状況 / Supported |
| -------------------- | ------------------------ |
| Latest (main)        | ✅ Yes                   |
| < Latest             | ❌ No                    |

## 脆弱性の報告方法 / Reporting a Vulnerability

セキュリティ上の脆弱性を発見した場合は、パブリックな Issue を作成せず、**GitHub の「非公開報告機能（Private Vulnerability Reporting）」** を使用して報告してください。

If you discover a security vulnerability, please do **NOT** create a public issue. Instead, use the **GitHub Private Vulnerability Reporting** feature to report it.

### 手順 / Steps:

1. リポジトリの **[Security]** タブをクリックします。  
   Click the **[Security]** tab of the repository.
2. サイドバーの **[Advisories]** を選択します。  
   Select **[Advisories]** in the sidebar.
3. **[Report a vulnerability]** をクリックして報告を送信してください。  
   Click **[Report a vulnerability]** to submit your report.

報告を受けた後、3営業日以内に確認の返信を行い、修正のスケジュールを調整します。  
After receiving a report, we will respond within 3 business days and coordinate the fix schedule.

## 公開ポリシー / Disclosure Policy

脆弱性の修正が完了し、新しいバージョンがリリースされるまで、詳細は非公開として扱われます。修正完了後、GitHub Security Advisory を通じて情報を公開します。

Details of the vulnerability will be kept private until a fix is completed and a new version is released. Information will be disclosed via GitHub Security Advisory once the fix is available.

---

## 2026 セキュリティ標準 / 2026 Security Standards

本プロジェクトでは、最新の Web セキュリティ標準を構造的に組み込んでいます。

### 1. サブリソース完全性 (SRI) の強制 / Mandatory SRI

全ての外部バイナリ（WASM等）およびスクリプトのロードには、SRI ハッシュ検証が必須です。改竄されたリソースの実行をブラウザレベルおよびライブラリレベルで遮断します。

### 2. 「Refuse by Exception」ポリシー / Injection Prevention

プロトコルレベルのコマンドインジェクションを防ぐため、不正な制御文字（\r, \n, \0 等）を含む入力はサニタイズせず即座に拒否（例外スロー）します。

### 3. 分離環境の診断 / Environment Diagnosis

WASM Threads 等の利用に不可欠な COOP/COEP ヘッダーの状態を自動的に診断し、不安全な環境での実行を警告・制限します。
