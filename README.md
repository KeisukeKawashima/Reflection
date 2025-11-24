# 今日の振り返り - Daily Reflection App

AIと対話しながら日々の出来事を振り返るWebアプリケーションです。

## 概要

このアプリは、毎日の「良かったこと」と「改善したいこと」を付箋形式で記録し、その中から一つを選んでAIコーチと対話しながら深く振り返ることができます。過去の記録を検索・閲覧する機能も備えています。

## 主な機能

### 1. 付箋ボード

- Miroライクなドラッグ&ドロップ可能な付箋ボード
- 「良かったこと」（緑）と「改善したいこと」（青）を自由に配置
- 付箋のコピー＆ペースト機能（Cmd/Ctrl + C/V）

### 2. AIとの対話

- 選択したトピックについてAIコーチが段階的に質問
- OpenAI GPT-3.5を使用した自然な対話
- 会話の進行に応じて質問内容が変化

### 3. 履歴管理

- 過去の振り返りを年月別に表示
- キーワード検索機能（ハイライト表示）
- 過去の振り返りや会話の再開が可能
- 記録の削除機能

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: SQLite (Prisma ORM)
- **AI**: OpenAI API (GPT-3.5-turbo)

## セットアップ

### 前提条件

- Node.js 20以上
- OpenAI APIキー

### インストール

```bash
# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma generate
npx prisma migrate dev

# 環境変数の設定
# .env.localファイルを作成し、以下を設定
OPENAI_API_KEY=your_openai_api_key_here
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### 本番ビルド

```bash
npm run build
npm start
```

## プロジェクト構成

```
.
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   └── dev.db                 # SQLiteデータベース
├── src/
│   └── app/
│       ├── api/
│       │   ├── chat/          # AI対話API
│       │   └── reflections/   # 振り返りデータCRUD API
│       ├── page.tsx           # メインアプリケーション
│       ├── layout.tsx         # レイアウト
│       └── globals.css        # グローバルスタイル
├── package.json
└── README.md
```

## データモデル

```prisma
model Reflection {
  id           String   @id @default(cuid())
  date         String   @unique      // YYYY-MM-DD形式
  items        Json                  // 付箋アイテムの配列
  selectedItem Json?                 // 選択されたトピック
  chatMessages Json                  // 会話履歴
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API エンドポイント

### Reflections API

- `GET /api/reflections` - 全ての振り返りを取得
- `POST /api/reflections` - 振り返りを保存/更新
- `DELETE /api/reflections/[date]` - 特定の日付の振り返りを削除

### Chat API

- `POST /api/chat` - AIとの対話（OpenAI API使用）

## 使い方

1. **付箋を追加**: 「良かったこと」または「改善したいこと」ボタンをクリック
2. **付箋を配置**: ドラッグ&ドロップで自由に配置
3. **トピックを選択**: 「次へ進む」をクリックし、深く考えたいトピックを選択
4. **AIと対話**: AIコーチの質問に答えながら振り返りを深める
5. **履歴を確認**: 「履歴」ボタンから過去の記録を閲覧・検索

## 特徴的な機能

### スマートな質問生成

AIは会話の段階に応じて質問を変化させます：

- **初期段階**: 背景や具体的状況を探る質問
- **中期段階**: 視点転換や深掘り質問
- **後期段階**: 行動や学びに焦点を当てた質問

### リトライ機能

OpenAI APIの呼び出しに失敗した場合、自動的にリトライし、それでも失敗した場合は段階に応じた適切なフォールバック質問を返します。

## ライセンス

MIT
