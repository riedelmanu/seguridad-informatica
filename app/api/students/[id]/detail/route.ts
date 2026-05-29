import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { checkServerPermission, getCurrentUserContext } from '@/app/lib/auth'
import { GetStudentDetailHandler } from '@/application/query/GetStudentDetailHandler'
import { UpdateStudentDetailHandler } from '@/application/command/UpdateStudentDetailHandler'
import { AuditLogRepository } from '@/infrastructure/repositories/AuditLogRepository'

export const GET = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
    // 1. Autenticación
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    // 2. Autorización PBAC
    const hasPermission = await checkServerPermission('read:student_detail') || await checkServerPermission('read:students')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'read:student_detail' o 'read:students'." },
            { status: 403 }
        )
    }

    // 3. Extraer contexto de usuario y parámetros
    const userContext = await getCurrentUserContext()
    if (!userContext) {
        return NextResponse.json({ error: 'No se pudo obtener el contexto de usuario.' }, { status: 500 })
    }

    const { id } = await params
    const studentId = parseInt(id, 10)
    if (isNaN(studentId)) {
        return NextResponse.json({ error: 'ID de estudiante inválido.' }, { status: 400 })
    }

    try {
        const handler = new GetStudentDetailHandler()
        const response = await handler.handle({ studentId }, userContext)

        // Registrar auditoría de lectura (No-bloqueante)
        const user = await currentUser()
        new AuditLogRepository().create({
            user_id: userId,
            user_email: user?.emailAddresses[0]?.emailAddress ?? 'unknown',
            action: 'READ_DETAIL',
            resource: `students/${studentId}/detail`,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            metadata: { student_id: studentId },
        }).catch(err => console.error('Audit log error:', err))

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error obteniendo detalle de estudiante:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}

export const PATCH = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
    // 1. Autenticación
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    // 2. Autorización PBAC
    const hasPermission = await checkServerPermission('write:student_detail') || await checkServerPermission('read:student_dni')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'write:student_detail' o 'read:student_dni'." },
            { status: 403 }
        )
    }

    // 3. Extraer contexto de usuario y parámetros
    const userContext = await getCurrentUserContext()
    if (!userContext) {
        return NextResponse.json({ error: 'No se pudo obtener el contexto de usuario.' }, { status: 500 })
    }

    const { id } = await params
    const studentId = parseInt(id, 10)
    if (isNaN(studentId)) {
        return NextResponse.json({ error: 'ID de estudiante inválido.' }, { status: 400 })
    }

    // 4. Obtener e ingresar el body
    try {
        const body = await request.json()
        const { detail } = body

        if (detail === undefined) {
            return NextResponse.json({ error: 'Falta el campo de descripción (detail).' }, { status: 400 })
        }

        const handler = new UpdateStudentDetailHandler()
        const response = await handler.handle({ studentId, detail }, userContext)

        // Registrar auditoría de modificación (No-bloqueante)
        const user = await currentUser()
        new AuditLogRepository().create({
            user_id: userId,
            user_email: user?.emailAddresses[0]?.emailAddress ?? 'unknown',
            action: 'UPDATE_DETAIL',
            resource: `students/${studentId}/detail`,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            metadata: { student_id: studentId },
        }).catch(err => console.error('Audit log error:', err))

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Error al actualizar detalle de estudiante:', error)
        const message = error.message || 'Error interno del servidor.'
        const status = error.message && error.message.includes('Validación') ? 400 : 500
        return NextResponse.json({ error: message }, { status })
    }
}
