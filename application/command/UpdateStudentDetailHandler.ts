import { z } from 'zod'
import { StudentRepository } from '@/infrastructure/repositories/StudentRepository'

export class UpdateStudentDetailHandler {
    private readonly repository: StudentRepository

    private static readonly InputSchema = z.object({
        studentId: z.number({ message: 'El ID de estudiante debe ser un número.' }),
        detail: z
            .string({ message: 'La descripción debe ser un texto.' })
            .max(500, 'La descripción no puede superar los 500 caracteres.')
            .trim(),
    })

    constructor(repository?: StudentRepository) {
        this.repository = repository ?? new StudentRepository()
    }

    async handle(command: UpdateStudentDetailCommand, _user: { email: string; role: string }): Promise<UpdateStudentDetailResponse> {
        // Validación de entrada Zod
        const parsed = UpdateStudentDetailHandler.InputSchema.safeParse(command)
        if (!parsed.success) {
            const errorMessage = parsed.error.issues.map(i => i.message).join(', ')
            throw new Error(errorMessage)
        }

        const { studentId, detail } = parsed.data
        await this.repository.updateDetail(studentId, detail)
        return { success: true }
    }
}

export interface UpdateStudentDetailCommand {
    studentId: number
    detail: string
}

export interface UpdateStudentDetailResponse {
    success: boolean
}
