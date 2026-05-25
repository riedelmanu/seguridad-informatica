import { AuditLogRepository, AuditLogEntry } from '@/infraestructure/repositories/AuditLogRepository'

export interface GetAuditLogQuery {
    limit?: number
    userId?: string
}

export interface GetAuditLogResponse {
    entries: AuditLogEntry[]
}

export class GetAuditLogHandler {
    private readonly repository: AuditLogRepository

    constructor(repository?: AuditLogRepository) {
        this.repository = repository ?? new AuditLogRepository()
    }

    async handle(query: GetAuditLogQuery): Promise<GetAuditLogResponse> {
        const entries = query.userId
            ? await this.repository.findByUser(query.userId, query.limit ?? 50)
            : await this.repository.findAll(query.limit ?? 100)

        return { entries }
    }
}
