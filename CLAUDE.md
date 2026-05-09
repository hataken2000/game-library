# game-library プロジェクト指示書

## 役割分担
- **クロ1**（全体管理）: 設計・仕様策定・レビュー・タスク分割
- **クロ2**（実装担当）: クロ1から渡されたタスクを実装する

## クロ2への基本指示
- このファイルと `SPEC.md` を必ず最初に読むこと
- パッケージマネージャーは **npm のみ**（bun/yarn 禁止）
- コメントは最小限（WHYが非自明なときだけ）
- 実装はPhaseごとに進める（SPEC.md参照）
- 完了したタスクは `/tmp/claude-relay.md` に報告する

## コーディング規約
- TypeScript strict mode
- コンポーネントは `src/components/` 以下
- Supabase クライアントは `src/lib/supabase.ts` に集約
- 環境変数は `VITE_` プレフィックス必須
- 型定義は `src/types/` 以下

## 禁止事項
- `any` 型の使用
- コンソールログの残留
- ハードコードされたAPIキー

## インフラ情報
- **GitHub:** hataken2000/game-library（個人アカウント）
- **GitHub Pages:** https://hataken2000.github.io/game-library/
- **Supabase project ref:** `utwmfyplefzrftcailpn`
- **Supabase URL:** `https://utwmfyplefzrftcailpn.supabase.co`
- **Anon Key:** JWT形式（`eyJ...`）。`.env.local` 参照。`sb_publishable_xxx` 形式はEdge Functionで使えないので注意

## Edge Functionデプロイ手順
Dockerは不要。以下のコマンドで直接デプロイできる：
```bash
SUPABASE_ACCESS_TOKEN=<token> supabase functions deploy <function-name> --project-ref utwmfyplefzrftcailpn
```
- アクセストークンは https://supabase.com/dashboard/account/tokens で取得
- デプロイ済み関数: `igdb-enrich`, `opencritic-enrich`, `steam-sync`

## Deno Edge Functionの注意点
- Supabase JS v2のクエリを `let` 変数に再代入してチェーニングすると型エラーでEarlyDrop（クラッシュ）する
  → 条件分岐の中でそれぞれ完全なクエリを書くこと
- 日本語タイトル判定は漢字範囲（`一-鿿`）だと中国語も混入する
  → ひらがな・カタカナ範囲（`぀-ヿ`）のみで判定すること

## 中継ルール
- タスク完了時: `/tmp/claude-relay.md` に `[game-library クロ2] → [クロ1]: 完了内容` を追記
- 不明点はファイルに書いて止まる（勝手に判断しない）
