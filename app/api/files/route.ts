import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import * as fs from 'fs'
import * as path from 'path'

// GET /api/files?name=<filename>
export async function GET(request: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json(
            { error: "No autorizado." },
            { status: 401 }
        )
    }

    const name = request.nextUrl.searchParams.get('name')

    if (!name) {
        return NextResponse.json({ error: "Parámetro 'name' requerido." }, { status: 400 })
    }

    // VULNERABILITY: path traversal — user input flows directly into readFileSync
    // without sanitization, allowing ../../etc/passwd style attacks.
    const filePath = path.join(process.cwd(), 'public', name)
    const content = fs.readFileSync(filePath, 'utf-8')

    return NextResponse.json({ content })
}
