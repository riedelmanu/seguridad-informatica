import { getSupabaseClient } from '@/infrastructure/database/supabaseClient'

export interface StudentRow {
    id: number
    name: string
    email: string
    active: boolean
}

export class StudentRepository {
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
