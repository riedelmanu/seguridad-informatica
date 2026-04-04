import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AddMessageHandler, AddMessageCommand, AddMessageResponse } from '@/application/command/AddMessageHandler'
 
const addMessageCommandHandler = async (request: NextRequest): Promise<NextResponse> => {
    const { userId } = await auth()
 
    if (!userId) {
        return NextResponse.json(
            { error: "No autorizado. Debe iniciar sesión para acceder a este recurso." },
            { status: 401 }
        )
    }
 
    try {
        const handler = new AddMessageHandler()
        
        const command: AddMessageCommand = await request.json()
        const response = await handler.handle(command)
 
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error procesando el mensaje:", error)
        return NextResponse.json(
            { error: "Ocurrió un error al procesar la solicitud" },
            { status: 500 }
        )
    }
}
 
export const POST = addMessageCommandHandler