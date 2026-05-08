import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  rapidApiKey: string
  offset: number
  limit: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rapidApiKey, offset, limit }: RequestBody = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: games, count } = await supabase
      .from('games')
      .select('id, title', { count: 'exact' })
      .is('opencritic_score', null)
      .not('title', 'is', null)
      .order('title')
      .range(offset, offset + limit - 1)

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, total: count ?? 0, hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0

    for (const game of games) {
      try {
        const searchRes = await fetch(
          `https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodeURIComponent(game.title)}`,
          {
            headers: {
              'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey,
            },
          }
        )
        const searchResults: Array<{ id: number; name: string }> = await searchRes.json()
        if (!Array.isArray(searchResults) || searchResults.length === 0) continue

        const gameId = searchResults[0].id

        const scoreRes = await fetch(
          `https://opencritic-api.p.rapidapi.com/game/${gameId}`,
          {
            headers: {
              'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey,
            },
          }
        )
        const scoreData: { score?: number; percentRecommended?: number } = await scoreRes.json()

        if (scoreData.score != null) {
          await supabase
            .from('games')
            .update({
              opencritic_score: scoreData.score,
              opencritic_percent_recommended: scoreData.percentRecommended ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', game.id)
          processed++
        }

        await new Promise((r) => setTimeout(r, 1100))
      } catch {
        continue
      }
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
