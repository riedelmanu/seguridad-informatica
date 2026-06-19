import { z } from 'zod'
import { StudentRepository } from '@/infrastructure/repositories/StudentRepository'

export class CreateStudentHandler {
    private readonly repository: StudentRepository

    private static readonly InputSchema = z.object({
        name: z
            .string({ message: 'El nombre debe ser un texto.' })
            .trim()
            .min(1, 'El nombre es obligatorio.')
            .max(255, 'El nombre no puede superar los 255 caracteres.'),
        email: z
            .string({ message: 'El email debe ser un texto.' })
            .trim()
            .min(1, 'El email es obligatorio.')
            .max(255, 'El email no puede superar los 255 caracteres.')
            .email('El email no tiene un formato válido.'),
        dni: z
            .string({ message: 'El DNI debe ser un texto.' })
            .trim()
            .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.')
            .optional()
            .or(z.literal('')),
    })

    constructor(repository?: StudentRepository) {
        this.repository = repository ?? new StudentRepository()
    }

    async handle(command: CreateStudentCommand, _user: { email: string; role: string }): Promise<CreateStudentResponse> {
        // Validación de entrada Zod (defensa en profundidad: la ruta también valida la sesión/permiso)
        const parsed = CreateStudentHandler.InputSchema.safeParse(command)
        if (!parsed.success) {
            const errorMessage = parsed.error.issues.map(i => i.message).join(', ')
            throw new Error(`Validación: ${errorMessage}`)
        }

        const { name, email, dni } = parsed.data
        const student = await this.repository.create({
            name,
            email,
            dni: dni && dni.length > 0 ? dni : null,
        })

        return { student }
    }
}

export interface CreateStudentCommand {
    name: string
    email: string
    dni?: string
}

export interface CreateStudentResponse {
    student: {
        id: number
        name: string
        email: string
        active: boolean
        detail: string | null
    }
}
