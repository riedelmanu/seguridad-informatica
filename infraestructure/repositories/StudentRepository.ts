import { getSupabaseClient } from '@/infraestructure/database/supabaseClient'
import { getSupabaseAnonClient } from '@/infraestructure/database/supabaseAnonClient'

export interface StudentRow {
    id: number
    name: string
    email: string
    active: boolean
    detail: string | null
}

export class StudentRepository {
    async findAll(user: { email: string; role: string }): Promise<StudentRow[]> {
        const supabase = getSupabaseAnonClient(user.email, user.role)

        const { data, error } = await supabase
            .from('students')
            .select('id, name, email, active')
            .eq('active', true)
            .order('id', { ascending: true })

        if (error) throw new Error(`Error al consultar estudiantes: ${error.message}`)

        return (data as StudentRow[]).map(r => ({ ...r, detail: null }))
    }

    async updateDetail(studentId: number, plainDetail: string): Promise<void> {
        const supabase = getSupabaseClient()
        const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY
        if (!encryptionKey) throw new Error('Falta la variable de entorno SUPABASE_ENCRYPTION_KEY')

        const { error } = await supabase.rpc('set_student_detail_encrypted', {
            p_id: studentId,
            p_plain_detail: plainDetail,
            p_aes_key: encryptionKey,
        })
        if (error) throw new Error(`Error al actualizar detalle del estudiante: ${error.message}`)
    }

    async getDetail(studentId: number): Promise<string | null> {
        const supabase = getSupabaseClient()
        const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY
        if (!encryptionKey) throw new Error('Falta la variable de entorno SUPABASE_ENCRYPTION_KEY')

        const { data, error } = await supabase.rpc('get_student_detail_decrypted', {
            p_id: studentId,
            p_aes_key: encryptionKey,
        })
        if (error) throw new Error(`Error al obtener detalle del estudiante: ${error.message}`)
        return data as string | null
    }

    async getDni(studentId: number): Promise<string | null> {
        const supabase = getSupabaseClient()
        const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY
        if (!encryptionKey) throw new Error('Falta la variable de entorno SUPABASE_ENCRYPTION_KEY')

        const { data, error } = await supabase.rpc('get_student_dni_decrypted', {
            p_id: studentId,
            p_aes_key: encryptionKey,
        })
        if (error) throw new Error(`Error al obtener DNI del estudiante: ${error.message}`)
        return data as string | null
    }
}
