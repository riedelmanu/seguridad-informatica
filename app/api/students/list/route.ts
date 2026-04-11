import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json(
            { error: "No autorizado. Debe iniciar sesión para acceder a este recurso." },
            { status: 401 }
        )
    }

    const user = await currentUser()
    const userRole = (user?.publicMetadata?.role) as string;

    if (userRole?.toLowerCase() !== 'docente' && userRole?.toLowerCase() !== 'admin') {
        return NextResponse.json(
            { error: "Acceso denegado. Rol insuficiente." },
            { status: 403 }
        )
    }
 
    try {
        const handler = new GetStudentsListHandler()
        
        const query: GetStudentsListQuery = {}
        const response = await handler.handle(query)
 
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error procesando el mensaje:", error)
        return NextResponse.json(
            { error: "Ocurrió un error al procesar la solicitud" },
            { status: 500 }
        )
    }
}