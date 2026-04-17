import { currentUser } from '@clerk/nextjs/server';

// estructura del JSON en Clerk
interface ClerkPublicMetadata {
    role?: string;
    permissions?: string[];
}

export const checkServerPermission = async (permission: string): Promise<boolean> => {
    try {
        const user = await currentUser();
        const publicMetadata = user?.publicMetadata as ClerkPublicMetadata;
        
        if (!publicMetadata || !Array.isArray(publicMetadata.permissions)) {
            return false;
        }

        return publicMetadata.permissions.includes(permission);
    } catch (error) {
        console.error("Error al verificar permisos en el servidor:", error);
        return false;
    }
};