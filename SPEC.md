# ゲームライブラリ管理ツール 仕様書

> クロ1作成 / クロ2実装担当向け引き継ぎ文書
> 作成日: 2026-05-08

---

## 概要

複数プラットフォームのゲームライブラリを一元管理するWebアプリ。
Steamは自動同期、その他はPlayniteエクスポートでインポート。
メタスコアはIGDB/OpenCriticから自動取得。タグのみ手動。

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| フロントエンド | React + TypeScript + Vite |
| ホスティング | GitHub Pages |
| DB | Supabase (PostgreSQL) |
| スタイル | Tailwind CSS |
| パッケージマネージャー | npm |

---

## 対応プラットフォームと自動化レベル

| プラットフォーム | 自動化 | 方式 |
|---|---|---|
| Steam | ✅ 完全自動 | Steam Web API（APIキー＋SteamID） |
| Epic Games | 🔶 半自動 | Playnite JSONインポート |
| GOG | 🔶 半自動 | Playnite JSONインポート |
| Battle.net | 🔶 半自動 | Playnite JSONインポート |
| その他 | 🔶 半自動 | Playnite JSONインポート |
| Amazon Games | ⚠️ 参考のみ | サービス2026年6月終了のため |

---

## データモデル（Supabaseテーブル設計）

### `games` テーブル（ゲームマスター）
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
igdb_id         integer UNIQUE          -- IGDBのゲームID（重複排除キー）
title           text NOT NULL
slug            text                    -- URL用スラッグ
cover_url       text                    -- カバー画像URL
genres          text[]                  -- ジャンル配列
release_year    integer
metacritic_score integer               -- 0-100
opencritic_score float                 -- 0-100
opencritic_percent_recommended float   -- 推奨率 %
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `platform_entries` テーブル（プラットフォーム別エントリ、重複許容）
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
game_id         uuid REFERENCES games(id) ON DELETE CASCADE
platform        text NOT NULL  -- 'steam' | 'epic' | 'gog' | 'battlenet' | 'other'
platform_game_id text          -- プラットフォーム固有ID（Steam appid等）
acquired_year   integer        -- 入手年度
acquired_date   date           -- 入手日（わかれば）
is_free         boolean DEFAULT false
price_paid      numeric(10,2)  -- 支払額（任意）
playtime_hours  float          -- プレイ時間（Steamのみ自動取得）
last_played     date           -- 最終プレイ日
created_at      timestamptz DEFAULT now()
```

### `dlcs` テーブル
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
platform_entry_id uuid REFERENCES platform_entries(id) ON DELETE CASCADE
title           text NOT NULL
platform_dlc_id text           -- Steam appid等
is_owned        boolean DEFAULT false
acquired_date   date
created_at      timestamptz DEFAULT now()
```

### `tags` テーブル
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text UNIQUE NOT NULL
color           text DEFAULT '#6366f1'  -- タグ色（hex）
created_at      timestamptz DEFAULT now()
```

### `game_tags` テーブル（中間テーブル）
```sql
game_id         uuid REFERENCES games(id) ON DELETE CASCADE
tag_id          uuid REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (game_id, tag_id)
```

---

## 外部API一覧

### Steam Web API
- ライブラリ取得: `GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`
  - params: `key={API_KEY}&steamid={STEAM_ID}&include_appinfo=1&include_played_free_games=1`
- DLC情報: `GET https://store.steampowered.com/api/appdetails?appids={APPID}`
  - response の `dlc` 配列と `packages` を利用
- レート制限: 100,000リクエスト/日

### IGDB API（Twitch OAuth）
- 認証: `POST https://id.twitch.tv/oauth2/token` (client_credentials)
- ゲーム検索: `POST https://api.igdb.com/v4/games`
  - body: `fields name,slug,cover.url,genres.name,first_release_date,aggregated_rating; search "{TITLE}"; limit 1;`
- レート制限: 4リクエスト/秒

### OpenCritic API（RapidAPI経由）
- 検索: `GET https://opencritic-api.p.rapidapi.com/game/search?criteria={TITLE}`
- スコア取得: `GET https://opencritic-api.p.rapidapi.com/game/{ID}`

---

## 画面構成

### 1. ライブラリ画面（メイン）
- ゲーム一覧（グリッド or リスト切替）
- フィルター: プラットフォーム / タグ / ジャンル / 入手年度
- ソート: タイトル / メタスコア / 入手日 / プレイ時間
- 検索バー
- 各ゲームカード: カバー画像・タイトル・プラットフォームバッジ・スコア・タグ

### 2. ゲーム詳細モーダル
- カバー画像・タイトル・ジャンル
- 所持プラットフォーム一覧（重複表示）
- DLC一覧（入手済み/未入手）
- メタスコア / OpenCriticスコア
- タグ編集
- プレイ時間・最終プレイ日（Steam）

### 3. 設定画面
- Steam APIキー / SteamID 入力
- IGDB APIキー（Twitch Client ID/Secret）
- OpenCritic APIキー（RapidAPI）
- Supabase URL / anon key
- 手動同期ボタン（Steam）
- Playnite JSONインポート

### 4. インポート画面
- Playnite JSONをドラッグ＆ドロップ
- インポートプレビュー（追加/更新/スキップ件数）
- 実行ボタン

---

## 同期フロー

### Steam自動同期
```
1. Steam API → GetOwnedGames → ゲーム一覧取得
2. 各ゲームをIGDB APIで検索 → igdb_id・メタデータ取得
3. OpenCritic APIでスコア取得
4. Steam appdetails APIでDLC情報取得
5. Supabaseにupsert（igdb_idで重複チェック）
6. platform_entriesにSteamエントリ追加（steam appidで重複チェック）
```

### Playniteインポート
```
1. PlayniteのJSONをパース
2. 各ゲームをIGDB APIで検索
3. Steam同様にメタデータ・スコア取得
4. Supabaseにupsert
```

---

## 実装優先順位

### Phase 1（MVP）
1. Supabaseセットアップ（テーブル作成）
2. Steam API連携（ライブラリ取得・upsert）
3. ライブラリ一覧表示（基本フィルター）
4. 設定画面（APIキー入力）

### Phase 2
5. IGDB API連携（メタデータ・カバー画像）
6. OpenCritic API連携（スコア）
7. DLC情報取得・表示
8. ゲーム詳細モーダル

### Phase 3
9. Playniteインポート機能
10. タグ機能
11. グリッド/リスト切替
12. GitHub Pagesデプロイ設定

---

## 環境変数（.env.local）

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STEAM_API_KEY=
VITE_STEAM_ID=
VITE_TWITCH_CLIENT_ID=
VITE_TWITCH_CLIENT_SECRET=
VITE_RAPIDAPI_KEY=
```

---

## GitHubリポジトリ

- アカウント: hataken2000（個人）
- リポジトリ名候補: `game-library`
- GitHub Pages: `hataken2000.github.io/game-library`

---

## クロ2への指示

上記仕様に従い実装してください。

### 注意点
- パッケージマネージャーは `npm` を使う（bun/yarnは不可）
- コメントは最小限に
- Phase 1から順番に実装すること
- Supabaseのマイグレーションファイルも作成すること（`supabase/migrations/`）
- 型安全のため Supabase CLI で型を自動生成する構成にすること
- GitHub Actions で GitHub Pages への自動デプロイを設定すること

### クロ1への完了報告
実装完了したフェーズごとに `/tmp/claude-relay.md` に以下の形式で報告すること：
```
[game-library クロ2] → [クロ1]: Phase X 完了。実装内容: XXX。残課題: XXX
```
