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
  refreshTitleJa?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { twitchClientId, twitchClientSecret, offset, limit, refreshTitleJa = false }: RequestBody = await req.json()

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

    let query = supabase
      .from('games')
      .select('id, title, slug', { count: 'exact' })
      .order('slug')
      .range(offset, offset + limit - 1)

    if (refreshTitleJa) {
      query = query.not('igdb_id', 'is', null).is('title_ja', null)
    } else {
      query = query.like('slug', 'steam-%').is('igdb_id', null)
    }

    const { data: games, count } = await query

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, total: count ?? 0, hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    for (const game of games) {
      const safeTitle = game.title.replace(/"/g, '\\"')
      const searchRes = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': twitchClientId,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: `search "${safeTitle}"; fields name,slug,cover.url,genres.name,first_release_date,aggregated_rating,alternative_names.name; limit 1;`,
      })

      if (!searchRes.ok) continue

      const results: Array<{
        id: number
        name: string
        slug: string
        cover?: { url: string }
        genres?: Array<{ name: string }>
        first_release_date?: number
        aggregated_rating?: number
        alternative_names?: Array<{ name: string }>
      }> = await searchRes.json()

      if (!Array.isArray(results) || results.length === 0) continue

      const ig = results[0]
      const jaName = ig.alternative_names?.find((n) =>
        /[぀-ヿ一-鿿]/.test(n.name)
      )?.name ?? null

      if (refreshTitleJa) {
        await supabase
          .from('games')
          .update({ title_ja: jaName, updated_at: new Date().toISOString() })
          .eq('id', game.id)
      } else {
        const coverUrl = ig.cover?.url
          ? 'https:' + ig.cover.url.replace('t_thumb', 't_cover_big')
          : null

        await supabase
          .from('games')
          .update({
            igdb_id: ig.id,
            cover_url: coverUrl,
            genres: ig.genres?.map((g) => g.name) ?? null,
            release_year: ig.first_release_date
              ? new Date(ig.first_release_date * 1000).getFullYear()
              : null,
            metacritic_score: ig.aggregated_rating != null
              ? Math.round(ig.aggregated_rating)
              : null,
            title_ja: jaName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', game.id)
      }

      processed++
      await new Promise((r) => setTimeout(r, 260))
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
