import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkServerPermission } from '@/app/lib/auth'
import { GetAuditLogHandler } from '@/application/query/GetAuditLogHandler'

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    const hasPermission = await checkServerPermission('read:audit_logs')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'read:audit_logs'." },
            { status: 403 }
        )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)
    const filterUserId = searchParams.get('userId') ?? undefined

    try {
        const handler = new GetAuditLogHandler()
        const response = await handler.handle({ limit, userId: filterUserId })
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error consultando audit log:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}
