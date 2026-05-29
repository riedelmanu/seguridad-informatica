import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Cliente privilegiado (service role): bypasea RLS.
// Solo usar para operaciones que requieren acceso total al schema (ej: writes auditados).
export function getSupabaseClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error('Falta la variable de entorno SUPABASE_URL')
    }
    if (!supabaseServiceRoleKey) {
        throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY. No usar publishable/anon key como service role.')
    }

    if (!_client) {
        _client = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { persistSession: false },
        })
    }
    return _client
}
