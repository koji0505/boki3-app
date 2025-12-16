# 日商簿記3級 仕訳問題アプリ

15分以内に15問の仕訳問題を解く練習用Webアプリケーション

## ディレクトリ構成

```
boki3/
├── app/
│   ├── layout.tsx                  # ルートレイアウト
│   ├── page.tsx                    # メインページ（問題一覧・タイマー）
│   ├── globals.css                 # グローバルスタイル
│   ├── api/
│   │   └── generate-problems/
│   │       └── route.ts            # Gemini API呼び出し
│   └── answer/
│       └── [id]/
│           └── page.tsx            # 解答・解説ページ
├── components/
│   ├── Timer.tsx                   # タイマーコンポーネント
│   └── Problem.tsx                 # 問題コンポーネント
├── data/
│   └── problems.json               # デフォルト問題データ（15問）
├── types/
│   └── index.ts                    # TypeScript型定義
├── lib/
│   └── judgement.ts                # 判定ロジック
├── .env.local                      # 環境変数（APIキー）
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Gemini API キーの設定

`.env.local`ファイルを作成し、Gemini APIキーを設定します。

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Gemini APIキーは[Google AI Studio](https://makersuite.google.com/app/apikey)から取得できます（無料枠あり）。

### 3. 開発サーバー起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 機能

### タイマー機能
- 制限時間の設定（デフォルト15分）
- Start / Stop / Reset ボタン
- 時間切れアラート

### 問題機能
- 15問の仕訳問題（デフォルトはローカルJSON）
- Gemini APIによる問題の自動生成・更新機能
- 各問題の借方・貸方入力
- 個別判定機能
- 全問題一括判定機能
- 正解・解説表示

### その他
- 入力データの自動保存（sessionStorage使用）
- 解答クリア機能
- 固定サイドバーでスクロール時もタイマー表示
