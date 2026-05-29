import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetStudentsSearchHandler, GetStudentsSearchQuery } from '@/application/query/GetStudentsSearchHandler'
import { checkServerPermission, getCurrentUserContext } from '@/app/lib/auth'
import { z } from 'zod'

const searchInputSchema = z.object({
    criterio: z.string().max(200, { message: 'El criterio de búsqueda es demasiado largo.' }).trim(),
})

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    // 1. Autenticación — ¿Quién sos?
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 })
    }

    // 2. Autorización — ¿Podés hacerlo?
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

    // 3. Validación de input (Zod)
    const { searchParams } = new URL(request.url)
    const criterio = searchParams.get('criterio') ?? ''

    const parsed = searchInputSchema.safeParse({ criterio })
    if (!parsed.success) {
        const errorMessage = parsed.error.issues.map(i => i.message).join(', ')
        return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // 4. Lógica de negocio
    try {
        const handler = new GetStudentsSearchHandler()
        const query: GetStudentsSearchQuery = { criterio: parsed.data.criterio }
        const response = await handler.handle(query, userContext)
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error procesando la búsqueda de estudiantes:', error)
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }
}
