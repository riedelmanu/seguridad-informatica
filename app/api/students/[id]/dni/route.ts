import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { checkServerPermission } from '@/app/lib/auth'
import { StudentRepository } from '@/infraestructure/repositories/StudentRepository'
import { AuditLogRepository } from '@/infraestructure/repositories/AuditLogRepository'

export const GET = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    const hasPermission = await checkServerPermission('read:student_dni')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'read:student_dni'." },
            { status: 403 }
        )
    }

    const { id } = await params
    const studentId = parseInt(id, 10)
    if (isNaN(studentId)) {
        return NextResponse.json({ error: 'ID de estudiante inválido.' }, { status: 400 })
    }

    try {
        const [repo, user] = await Promise.all([
            Promise.resolve(new StudentRepository()),
            currentUser(),
        ])
        const dni = await repo.getDni(studentId)
        if (dni === null) {
            return NextResponse.json({ error: 'DNI no encontrado.' }, { status: 404 })
        }

        // Audit log no-bloqueante: un fallo aquí nunca interrumpe la respuesta
        new AuditLogRepository().create({
            user_id: userId,
            user_email: user?.emailAddresses[0]?.emailAddress ?? 'unknown',
            action: 'READ_DNI',
            resource: `students/${studentId}/dni`,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            metadata: { student_id: studentId },
        }).catch(err => console.error('Audit log error:', err))

        return NextResponse.json({ dni })
    } catch (error) {
        console.error('Error obteniendo DNI:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}
