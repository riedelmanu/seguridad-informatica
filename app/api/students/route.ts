import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { checkServerPermission, getCurrentUserContext } from '@/app/lib/auth'
import { CreateStudentHandler } from '@/application/command/CreateStudentHandler'
import { AuditLogRepository } from '@/infrastructure/repositories/AuditLogRepository'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
    // 1. Autenticación — ¿Quién sos?
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    // 2. Autorización PBAC — dar de alta estudiantes es privilegio del rol docente
    const hasPermission = await checkServerPermission('create:students')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'create:students'." },
            { status: 403 }
        )
    }

    // 3. Contexto de usuario
    const userContext = await getCurrentUserContext()
    if (!userContext) {
        return NextResponse.json({ error: 'No se pudo obtener el contexto de usuario.' }, { status: 500 })
    }

    // 4. Lógica de negocio
    try {
        const body = await request.json()
        const { name, email, dni } = body

        const handler = new CreateStudentHandler()
        const response = await handler.handle({ name, email, dni }, userContext)

        // Registrar auditoría de creación (No-bloqueante)
        const user = await currentUser()
        new AuditLogRepository().create({
            user_id: userId,
            user_email: user?.emailAddresses[0]?.emailAddress ?? 'unknown',
            action: 'CREATE_STUDENT',
            resource: `students/${response.student.id}`,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            metadata: { student_id: response.student.id, email: response.student.email },
        }).catch(err => console.error('Audit log error:', err))

        return NextResponse.json(response, { status: 201 })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error interno del servidor.'

        if (message === 'DUPLICATE_EMAIL') {
            return NextResponse.json({ error: 'Ya existe un estudiante con ese email.' }, { status: 409 })
        }
        if (message.startsWith('Validación')) {
            return NextResponse.json({ error: message }, { status: 400 })
        }

        console.error('Error al crear estudiante:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}
