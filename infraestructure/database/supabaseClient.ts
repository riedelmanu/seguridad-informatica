import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Cliente privilegiado (service role): bypasea RLS.
// Solo usar para operaciones que requieren acceso total al schema (ej: writes auditados).
export function getSupabaseClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
    }

    if (!_client) {
        _client = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { persistSession: false },
        })
    }
    return _client
}
