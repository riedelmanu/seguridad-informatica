import { getSupabaseClient } from '@/infrastructure/database/supabaseClient'

export interface AuditLogEntry {
    id: number
    timestamp: string
    user_id: string
    user_email: string
    action: string
    resource: string
    ip_address: string | null
    user_agent: string | null
    metadata: Record<string, unknown> | null
}

export interface CreateAuditLogEntry {
    user_id: string
    user_email: string
    action: string
    resource: string
    ip_address?: string | null
    user_agent?: string | null
    metadata?: Record<string, unknown> | null
}

export class AuditLogRepository {
    async create(entry: CreateAuditLogEntry): Promise<void> {
        const supabase = getSupabaseClient()
        const { error } = await supabase.from('app_audit_log').insert(entry)
        if (error) {
            // El audit log nunca debe romper el flujo principal
            console.error('Error escribiendo audit log:', error.message)
        }
    }

    async findAll(limit = 100): Promise<AuditLogEntry[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('app_audit_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error) throw new Error(`Error al consultar audit log: ${error.message}`)
        return (data ?? []) as AuditLogEntry[]
    }

    async findByUser(userId: string, limit = 50): Promise<AuditLogEntry[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('app_audit_log')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error) throw new Error(`Error al consultar audit log por usuario: ${error.message}`)
        return (data ?? []) as AuditLogEntry[]
    }
}
