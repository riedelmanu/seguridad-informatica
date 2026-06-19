import { getSupabaseClient } from '@/infrastructure/database/supabaseClient'
import { getSupabaseAnonClient } from '@/infrastructure/database/supabaseAnonClient'

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

    async searchSecure(criterio: string): Promise<StudentRow[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('buscar_estudiantes_segura', {
            p_criterio: criterio,
        })
        if (error) throw new Error(`Error al buscar estudiantes: ${error.message}`)
        return (data as StudentRow[]).map(r => ({ ...r, detail: null }))
    }

    async create(input: { name: string; email: string; dni?: string | null }): Promise<StudentRow> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('students')
            .insert({ name: input.name, email: input.email, active: true })
            .select('id, name, email, active')
            .single()

        if (error) {
            // 23505 = unique_violation (email duplicado)
            if (error.code === '23505') throw new Error('DUPLICATE_EMAIL')
            throw new Error(`Error al crear estudiante: ${error.message}`)
        }

        const row = data as StudentRow

        // El DNI es PII: se cifra server-side con AES-256 vía RPC, nunca se guarda en claro.
        if (input.dni) {
            const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY
            if (!encryptionKey) throw new Error('Falta la variable de entorno SUPABASE_ENCRYPTION_KEY')

            const { error: dniError } = await supabase.rpc('set_student_dni_encrypted', {
                p_id: row.id,
                p_plain_dni: input.dni,
                p_aes_key: encryptionKey,
            })
            if (dniError) throw new Error(`Error al cifrar DNI del estudiante: ${dniError.message}`)
        }

        return { ...row, detail: null }
    }

    async updateDetail(studentId: number, plainDetail: string): Promise<void> {
        const supabase = getSupabaseClient()

        const { error } = await supabase.rpc('actualizar_descripcion_segura', {
            p_estudiante_id: studentId,
            p_nueva_descripcion: plainDetail,
        })
        if (error) throw new Error(`Error al actualizar detalle del estudiante: ${error.message}`)
    }

    async getDetail(studentId: number): Promise<string | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('students')
            .select('detail')
            .eq('id', studentId)
            .single()
        if (error) throw new Error(`Error al obtener detalle del estudiante: ${error.message}`)
        return data?.detail ?? null
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
