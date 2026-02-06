FROM nginx:alpine

# メタデータ
LABEL maintainer="multi-game-engines"
LABEL description="Engine binary CDN for multi-game-engines"
LABEL version="1.0"

# nginx 設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

# エンジンバイナリ用ディレクトリ作成
RUN mkdir -p /usr/share/nginx/html/v1

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# ポート
EXPOSE 80

# エントリーポイント
CMD ["nginx", "-g", "daemon off;"]
