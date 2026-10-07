# ADR 063: チャンク取得の通信境界

Status: Accepted
Date: 2026-10-07

main `2b6b534`でPR #268の依存修正は統合済み。監査0件、統合後CI・E2E・Release・文書公開・SRI更新は成功。今回M1aの通信境界を修正（統合待ち）：キャッシュ前にURLを検証し、HEAD・Range・GETはsafeFetch、credentials omit、redirect errorを使う。URL内資格情報・不正URL・外部HTTPをSECURITY_ERRORで拒否する。HEADのセキュリティ拒否・中断はfallbackしない。CodeQL 68–70の閉鎖は統合後に確認する。M1bのSRI必須化、M1cの応答サイズ契約、Q1は公開API経由のテストへ移行し、anyと抑制を除去済み（統合待ち）。Dependabot PR #267のaction-download-artifact v27更新も本変更に含める。

HEADは能力検査のため通常のネットワーク失敗だけfallbackする。ブラウザーのmanual redirectはopaque応答を返して転送先を検証できないため、redirect errorを選択する。HTTP loopback/PortlessはADR 060を維持。SRI形式・キャッシュ完全性・Range応答サイズは別契約として追跡する。相対URLはブラウザーのlocationを基準に解決し、非ブラウザーでは拒否する。SecurityAdvisor.safeFetchの他の呼び出しは既存のredirect設定を維持する。
