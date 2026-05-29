import { StudentRepository } from '@/infrastructure/repositories/StudentRepository'

export class GetStudentDetailHandler {
    private readonly repository: StudentRepository

    constructor(repository?: StudentRepository) {
        this.repository = repository ?? new StudentRepository()
    }

    async handle(query: GetStudentDetailQuery, _user: { email: string; role: string }): Promise<GetStudentDetailResponse> {
        const detail = await this.repository.getDetail(query.studentId)
        return { detail }
    }
}

export interface GetStudentDetailQuery {
    studentId: number
}

export interface GetStudentDetailResponse {
    detail: string | null
}
