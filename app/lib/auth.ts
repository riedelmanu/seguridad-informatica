import { currentUser } from '@clerk/nextjs/server'

interface ClerkPublicMetadata {
    role?: string
    permissions?: string[]
}

export const checkServerPermission = async (permission: string): Promise<boolean> => {
    try {
        const user = await currentUser()
        const publicMetadata = user?.publicMetadata as ClerkPublicMetadata
        if (!publicMetadata || !Array.isArray(publicMetadata.permissions)) return false
        return publicMetadata.permissions.includes(permission)
    } catch (error) {
        console.error("Error al verificar permisos en el servidor:", error)
        return false
    }
}

// Retorna email y rol del usuario actual para pasarlos al cliente Supabase anon (RLS).
export const getCurrentUserContext = async (): Promise<{ email: string; role: string } | null> => {
    try {
        const user = await currentUser()
        if (!user) return null
        const email = user.emailAddresses[0]?.emailAddress ?? ''
        const role = (user.publicMetadata as ClerkPublicMetadata).role ?? 'student'
        return { email, role }
    } catch {
        return null
    }
}
