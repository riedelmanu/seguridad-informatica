import { StudentRepository } from '@/infrastructure/repositories/StudentRepository'

export class GetStudentsSearchHandler {
    private readonly repository: StudentRepository

    constructor(repository?: StudentRepository) {
        this.repository = repository ?? new StudentRepository()
    }

    async handle(query: GetStudentsSearchQuery, _user: { email: string; role: string }): Promise<GetStudentsSearchResponse> {
        const students = await this.repository.searchSecure(query.criterio)
        return { list: students }
    }
}

export interface GetStudentsSearchQuery {
    criterio: string
}

export interface GetStudentsSearchResponse {
    list: Student[]
}

export interface Student {
    id: number
    name: string
    email: string
    active: boolean
    detail: string | null
}
