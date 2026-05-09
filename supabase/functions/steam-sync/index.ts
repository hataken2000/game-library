import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK = 200

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { steamApiKey, steamId } = await req.json()

  const steamRes = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`
  )
  if (!steamRes.ok) {
    return new Response(JSON.stringify({ error: 'Steam API error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const steamData = await steamRes.json()
  const games: { appid: number; name: string; playtime_forever: number }[] =
    steamData.response?.games ?? []

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 既存のSteam platform_entriesを一括取得
  const { data: existingEntries } = await supabase
    .from('platform_entries')
    .select('platform_game_id, id')
    .eq('platform', 'steam')

  const existingAppIds = new Set(existingEntries?.map((e) => e.platform_game_id) ?? [])
  const newGames = games.filter((g) => !existingAppIds.has(String(g.appid)))

  // 新規ゲームをCHUNKずつバルクinsert
  for (let i = 0; i < newGames.length; i += CHUNK) {
    const chunk = newGames.slice(i, i + CHUNK)

    // gamesテーブルにバルクupsert（slug重複時は無視）
    const { data: insertedGames } = await supabase
      .from('games')
      .upsert(chunk.map((g) => ({
        title: g.name,
        slug: `steam-${g.appid}`,
        genres: [],
      })), { onConflict: 'slug', ignoreDuplicates: true })
      .select('id, slug')

    if (!insertedGames?.length) continue

    const slugToId = new Map(insertedGames.map((g) => [g.slug, g.id]))

    // platform_entriesにバルクinsert
    await supabase.from('platform_entries').insert(
      chunk
        .map((g) => ({
          game_id: slugToId.get(`steam-${g.appid}`),
          platform: 'steam',
          platform_game_id: String(g.appid),
          is_free: false,
          playtime_hours: g.playtime_forever ? Math.round(g.playtime_forever / 60) : null,
        }))
        .filter((e) => e.game_id)
    )
  }

  return new Response(
    JSON.stringify({ added: newGames.length, total: games.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
