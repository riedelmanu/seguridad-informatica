import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'
import { checkServerPermission, getCurrentUserContext } from '@/app/lib/auth'

export const GET = async (_request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    const hasPermission = await checkServerPermission('read:students')
    if (!hasPermission) {
        return NextResponse.json(
            { error: "Acceso denegado. No tienes el permiso 'read:students'." },
            { status: 403 }
        )
    }

    const userContext = await getCurrentUserContext()
    if (!userContext) {
        return NextResponse.json({ error: 'No se pudo obtener el contexto de usuario.' }, { status: 500 })
    }

    try {
        const handler = new GetStudentsListHandler()
        const query: GetStudentsListQuery = {}
        const response = await handler.handle(query, userContext)
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error procesando la solicitud de estudiantes:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}
