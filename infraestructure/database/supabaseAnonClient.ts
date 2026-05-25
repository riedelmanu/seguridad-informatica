import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

function signUserJwt(email: string, role: string, jwtSecret: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const payload = Buffer.from(
        JSON.stringify({ email, role, iat: now, exp: now + 3600 })
    ).toString('base64url')
    const signature = createHmac('sha256', jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url')
    return `${header}.${payload}.${signature}`
}

// Cliente anon con identidad de usuario inyectada: respeta RLS.
// Si SUPABASE_JWT_SECRET no está configurado, usa el cliente sin JWT (RLS abierto).
export function getSupabaseAnonClient(email: string, role: string): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const jwtSecret = process.env.SUPABASE_JWT_SECRET

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Faltan variables de entorno: SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    const headers: Record<string, string> = {}
    if (jwtSecret) {
        headers['Authorization'] = `Bearer ${signUserJwt(email, role, jwtSecret)}`
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers },
    })
}
