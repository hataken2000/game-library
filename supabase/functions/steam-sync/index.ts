import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  const games = steamData.response?.games ?? []

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  for (const g of games) {
    const appid = String(g.appid)
    const playtimeHours = g.playtime_forever ? Math.round(g.playtime_forever / 60) : null

    const { data: existingEntry } = await supabase
      .from('platform_entries')
      .select('id')
      .eq('platform', 'steam')
      .eq('platform_game_id', appid)
      .maybeSingle()

    if (existingEntry) {
      await supabase
        .from('platform_entries')
        .update({ playtime_hours: playtimeHours })
        .eq('id', existingEntry.id)
      continue
    }

    const { data: gameRow } = await supabase
      .from('games')
      .insert({ title: g.name, genres: [] })
      .select('id')
      .single()

    if (!gameRow) continue

    await supabase.from('platform_entries').insert({
      game_id: gameRow.id,
      platform: 'steam',
      platform_game_id: appid,
      is_free: false,
      playtime_hours: playtimeHours,
    })
  }

  return new Response(JSON.stringify({ count: games.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
