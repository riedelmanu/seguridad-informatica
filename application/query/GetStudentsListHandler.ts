import { StudentRepository } from '@/infraestructure/repositories/StudentRepository'

export class GetStudentsListHandler {
    private readonly repository: StudentRepository

    constructor(repository?: StudentRepository) {
        this.repository = repository ?? new StudentRepository()
    }

    async handle(_query: GetStudentsListQuery): Promise<GetStudentsListResponse> {
        const students = await this.repository.findAll()
        return { list: students }
    }
}

export type GetStudentsListQuery = Record<string, never>

export interface GetStudentsListResponse {
    list: Student[]
}

export interface Student {
    id: number
    name: string
    email: string
    active: boolean
}
