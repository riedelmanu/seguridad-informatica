import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'
 
const getStudentsListQueryHandler = async (request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()
 
    if (!userId) {
        return NextResponse.json(
            { error: "No autorizado. Debe iniciar sesión para acceder a este recurso." },
            { status: 401 }
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
 
export const GET = getStudentsListQueryHandler