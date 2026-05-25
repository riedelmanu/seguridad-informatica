import { getSupabaseClient } from '@/infrastructure/database/supabaseClient'

export interface StudentRow {
    id: number
    name: string
    email: string
    active: boolean
}

export class StudentRepository {
    async getDni(studentId: number): Promise<string | null> {
        const supabase = getSupabaseClient()
        const aesKey = process.env.SUPABASE_ENCRYPTION_KEY ?? 'secure-campus-demo-2026'

        const { data, error } = await supabase.rpc('get_student_dni_decrypted', {
            p_id: studentId,
            p_aes_key: aesKey,
        })

        if (error) throw new Error(`Error al descifrar DNI: ${error.message}`)
        return (data as string | null) ?? null
    }

    async findAll(): Promise<StudentRow[]> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('students')
            .select('id, name, email, active')
            .eq('active', true)
            .order('id', { ascending: true })

        if (error) {
            throw new Error(`Error al consultar estudiantes: ${error.message}`)
        }

        return data as StudentRow[]
    }
}
