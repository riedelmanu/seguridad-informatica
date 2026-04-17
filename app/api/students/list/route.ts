import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'
import { checkServerPermission } from '@/app/lib/auth' 

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json(
            { error: "No autorizado. Debe iniciar sesión." },
            { status: 401 }
        )
    }

    try {
        // LA ÚNICA ADUANA: ¿Tiene el permiso específico?
        const hasPermission = await checkServerPermission("read:students");

        if (!hasPermission) {
            return NextResponse.json(
                { error: "Acceso denegado. No tienes el permiso 'read:students'." },
                { status: 403 }
            );
        }

        // Si pasó, buscamos la lista:
        const handler = new GetStudentsListHandler()
        const query: GetStudentsListQuery = {}
        const response = await handler.handle(query)
 
        return NextResponse.json(response)
        
    } catch (error) {
        console.error("Error crítico procesando la solicitud:", error)
        return NextResponse.json(
            { error: "Ocurrió un error en el servidor al procesar la solicitud" },
            { status: 500 }
        )
    }
}