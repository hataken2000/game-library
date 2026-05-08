import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  twitchClientId: string
  twitchClientSecret: string
  offset: number
  limit: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { twitchClientId, twitchClientSecret, offset, limit }: RequestBody = await req.json()

    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    )
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: `Twitch auth failed: ${JSON.stringify(tokenData)}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const accessToken = tokenData.access_token

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: games, count } = await supabase
      .from('games')
      .select('id, title, slug', { count: 'exact' })
      .like('slug', 'steam-%')
      .is('igdb_id', null)
      .order('title')
      .range(offset, offset + limit - 1)

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, total: count ?? 0, hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appids = games.map((g) => g.slug.replace('steam-', ''))

    const externalRes = await fetch('https://api.igdb.com/v4/external_games', {
      method: 'POST',
      headers: {
        'Client-ID': twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `fields game,uid; where category=1 & uid=(${appids.join(',')}); limit 500;`,
    })
    const externalGames: Array<{ game: number; uid: string }> = await externalRes.json()

    if (!Array.isArray(externalGames) || externalGames.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, total: count ?? 0, hasMore: (offset + limit) < (count ?? 0), debug: externalGames }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appidToIgdbId: Record<string, number> = {}
    for (const eg of externalGames) {
      appidToIgdbId[eg.uid] = eg.game
    }

    const igdbIds = [...new Set(externalGames.map((eg) => eg.game))]

    const igdbGamesRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `fields name,slug,cover.url,genres.name,first_release_date,aggregated_rating; where id=(${igdbIds.join(',')}); limit 500;`,
    })
    const igdbGames: Array<{
      id: number
      name: string
      slug: string
      cover?: { url: string }
      genres?: Array<{ name: string }>
      first_release_date?: number
      aggregated_rating?: number
    }> = await igdbGamesRes.json()

    const igdbGameMap: Record<number, typeof igdbGames[number]> = {}
    for (const ig of igdbGames) {
      igdbGameMap[ig.id] = ig
    }

    let processed = 0
    for (const game of games) {
      const appid = game.slug.replace('steam-', '')
      const igdbId = appidToIgdbId[appid]
      if (!igdbId) continue

      const igdbGame = igdbGameMap[igdbId]
      if (!igdbGame) continue

      const coverUrl = igdbGame.cover?.url
        ? 'https:' + igdbGame.cover.url.replace('t_thumb', 't_cover_big')
        : null
      const genres = igdbGame.genres?.map((g) => g.name) ?? null
      const releaseYear = igdbGame.first_release_date
        ? new Date(igdbGame.first_release_date * 1000).getFullYear()
        : null
      const metacriticScore = igdbGame.aggregated_rating != null
        ? Math.round(igdbGame.aggregated_rating)
        : null

      await supabase
        .from('games')
        .update({
          igdb_id: igdbId,
          cover_url: coverUrl,
          genres,
          release_year: releaseYear,
          metacritic_score: metacriticScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', game.id)

      processed++
    }

    return new Response(
      JSON.stringify({ processed, total: count ?? 0, hasMore: (offset + limit) < (count ?? 0) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
