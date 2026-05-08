export async function syncSteamLibrary(): Promise<{ count: number }> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-sync`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        steamApiKey: import.meta.env.VITE_STEAM_API_KEY,
        steamId: import.meta.env.VITE_STEAM_ID,
      }),
    }
  )
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
  return res.json()
}
