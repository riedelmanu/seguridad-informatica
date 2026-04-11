---
description: Directrices de Ciberseguridad y Control de Acceso. Contiene reglas críticas sobre permisos y autorización.
---

# 🛡️ Cybersecurity Guidelines & Access Control

Este proyecto aplica estrictamente **Autorización Basada en Permisos** (Permissions-Based Authorization) en lugar de verificar directamente contra roles. Un rol simplemente debería ser un contenedor de permisos en el proveedor de identidad, la aplicación siempre debe consultar el permiso subyacente.

## 🚨 REGLAS CRÍTICAS PARA TODOS LOS AGENTES DE IA

### 1. Verifica contra PERMISOS, NO contra ROLES
Nunca debes codificar de manera estática (hardcode) preguntas sobre roles como `if (user.role === 'teacher')` o `if (user.role === 'student')`.
Siempre debes verificar si el usuario tiene el permiso específico para realizar una acción o ver un recurso. Ejemplos:

```tsx
// ❌ INCORRECTO (Verificación de Rol)
if (user.role === 'profesor') { ... }

// ✅ CORRECTO (Verificación de Permiso)
if (hasPermission("read:students")) { ... }
```

### 2. Detalles de Implementación en la App
Los permisos del usuario se almacenan en `publicMetadata.permissions` provenientes de la cuenta de Clerk.

- **Frontend (Client Components)**: Usa el custom hook `usePermissions()` definido en `app/hooks/usePermissions.ts`.
  ```tsx
  import { usePermissions } from "@/app/hooks/usePermissions";
  
  export function MyComponent() {
      const { hasPermission, isLoaded } = usePermissions();
      
      if (!isLoaded) return null;
      if (!hasPermission("read:secure_data")) return <div>Access Denied</div>;
      
      return <div>Contenido Seguro</div>;
  }
  ```

- **Backend (Server Components / API Routes)**: Usa el helper `checkServerPermission()` definido en `app/lib/auth.ts`.
  ```ts
  import { checkServerPermission } from '@/app/lib/auth';
  
  export async function GET(request: NextRequest) {
      const hasPermission = await checkServerPermission("read:secure_data");
      
      if (!hasPermission) { 
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 }); 
      }
      
      // ... procesamiento ...
  }
  ```

### 3. Agregando Nuevas Funcionalidades
Cada vez que crees una nueva página (`page.tsx`) o una nueva ruta de API (`route.ts`) que manipule información que no sea pública, **SIEMPRE**:
1. Define qué permiso o acción se requiere (ej. `write:messages`, `delete:users`, `read:grades`).
2. Agrega la verificación de este permiso al inicio del componente o manejador (handler).
3. Asegúrate de devolver una respuesta `403 Forbidden` en la API o mostrar un mensaje genérico de "Acceso Denegado" (o no renderizar el link) en la UI.
