import { auth } from '@clerk/nextjs/server';

/**
 * Checks if the current server-side authenticated user has the specified permission.
 * Permissions are expected to be stored in the user's publicMetadata in Clerk:
 * { "permissions": ["read:students", "write:students"] }
 */
export const checkServerPermission = async (permission: string) => {
    const { sessionClaims } = await auth();
    const publicMetadata = sessionClaims?.metadata as Record<string, any>;
    
    // Si no hay metadatos o no hay array de permisos, el usuario no tiene el permiso.
    if (!publicMetadata || !Array.isArray(publicMetadata.permissions)) {
        return false;
    }

    return publicMetadata.permissions.includes(permission);
};
