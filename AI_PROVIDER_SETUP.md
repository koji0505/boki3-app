# AIプロバイダー設定ガイド

このアプリは **Gemini API** と **Groq API** の両方に対応しています。

## 環境変数の設定

`.env.local` ファイルに以下を追加してください：

```bash
# AIプロバイダーの選択 (gemini または groq)
AI_PROVIDER=groq

# Gemini API Key (Google AI Studio から取得)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API Key (Groq Console から取得)
GROQ_API_KEY=your_groq_api_key_here
```

## Groq API Keyの取得方法

1. **Groq Console にアクセス**: https://console.groq.com
2. **アカウント作成**: 無料でサインアップ（クレジットカード不要）
3. **API Keyを生成**:
   - 左メニューの "API Keys" をクリック
   - "Create API Key" をクリック
   - 生成されたKeyをコピー
4. **`.env.local` に追加**: `GROQ_API_KEY=your_key_here`

## プロバイダーの切り替え方法

### Groqを使用する場合（推奨）

```bash
AI_PROVIDER=groq
```

**メリット:**
- ✅ 1日14,400リクエスト（Geminiの720倍！）
- ✅ 高速なレスポンス
- ✅ 503エラーが発生しにくい
- ✅ クレジットカード不要

### Geminiを使用する場合

```bash
AI_PROVIDER=gemini
```

**メリット:**
- ✅ Googleの公式AI
- ✅ 日本語処理が優秀

**デメリット:**
- ⚠️ 1日20リクエストまで
- ⚠️ 503エラー（サーバー過負荷）が発生しやすい

## 使用モデル

- **Groq**: `llama-3.3-70b-versatile` (70Bパラメータ)
- **Gemini**: `gemini-2.5-flash`

## トラブルシューティング

### エラー: "API key not configured"
→ `.env.local` で選択したプロバイダーのAPIキーが設定されているか確認

### エラー: "503 Service Unavailable" (Gemini)
→ `AI_PROVIDER=groq` に切り替えることを推奨

### エラー: "401 Unauthorized" (Groq)
→ Groq API Keyが正しいか確認

## ローカルでテスト

```bash
# 開発サーバー起動
npm run dev

# http://localhost:3000 でアクセス
# 「問題の更新」ボタンで動作確認
```

コンソールに "Using Groq API..." または "Using Gemini API..." と表示されます。

## Vercelへのデプロイ

1. Vercelの管理画面にアクセス
2. プロジェクト設定 → Environment Variables
3. 以下を追加：
   - `AI_PROVIDER`: `groq`
   - `GROQ_API_KEY`: (GroqのAPIキー)
   - `GEMINI_API_KEY`: (GeminiのAPIキー) ※バックアップ用

4. Redeploy

## 参考リンク

- [Groq Documentation](https://console.groq.com/docs/overview)
- [Groq API Quickstart](https://console.groq.com/docs/quickstart)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
