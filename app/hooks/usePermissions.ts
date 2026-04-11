import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';

/**
 * Hook cliente para verificar permisos basados en publicMetadata de Clerk.
 * Ejemplo de data esperada en Clerk publicMetadata: { "permissions": ["read:students"] }
 */
export const usePermissions = () => {
    const { user, isLoaded } = useUser();

    const hasPermission = useCallback((permission: string) => {
        if (!isLoaded || !user || !user.publicMetadata) {
            return false;
        }

        const permissions = user.publicMetadata.permissions;
        
        if (!Array.isArray(permissions)) {
            return false;
        }

        return permissions.includes(permission);
    }, [user, isLoaded]);

    return { hasPermission, isLoaded };
};
