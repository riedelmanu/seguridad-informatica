import { createClient, SupabaseClient } from '@supabase/supabase-js'

// La publishable key es pública por diseño (equivalente a la anon key).
// NEXT_PUBLIC_ es aceptable para ella — lo que NUNCA debe ser NEXT_PUBLIC_ es la Service Role Key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Revisar .env.local.'
    )
}

const _url = supabaseUrl as string
const _key = supabaseKey as string

// Singleton: Next.js puede invocar esta función varias veces en el mismo proceso
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        _client = createClient(_url, _key, {
            auth: { persistSession: false },
        })
    }
    return _client
}
