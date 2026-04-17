# Secure Campus IA 🎓

Bienvenido al repositorio de **Secure Campus IA**. Este proyecto es una aplicación web moderna desarrollada con Next.js que implementa una interfaz de chat con Inteligencia Artificial.

Está diseñada con un enfoque _mobile-first_ para que se sienta como una aplicación nativa (sin scroll global, solo en el área de mensajes) y cuenta con un diseño limpio utilizando Tailwind CSS.

---

## 🚀 Cómo empezar (Guía rápida)

### Requisitos previos
Asegúrate de tener instalado en tu computadora:
- Node.js (Se recomienda la versión 18 o superior).

### Instalación y ejecución

1. **Instala las dependencias** del proyecto. Abre tu terminal en la carpeta raíz del proyecto y ejecuta:
   ```bash
   npm install
   ```

2. **Inicia el servidor de desarrollo** localmente:
   ```bash
   npm run dev
   ```

3. **Abre la aplicación:** Ve a tu navegador y entra a http://localhost:3000. ¡Deberías ver la interfaz del chat!

---

## 🛠️ Tecnologías Principales

- **Next.js (App Router):** El framework de React que usamos tanto para el frontend como para las rutas de API (backend ligero).
- **React:** Para construir la interfaz de usuario.
- **Tailwind CSS:** Para los estilos rápidos, responsivos y el soporte de "Modo Oscuro".
- **Zustand:** Para manejar el estado global de la aplicación (como guardar el historial de la conversación).

---

## 📂 Estructura clave para estudiantes

Si vas a modificar el código, estos son los archivos y carpetas más importantes que debes conocer:

- 🖥️ `app/page.tsx`: Es la pantalla principal. Aquí está el diseño del chat (el _Header_, el área de mensajes y el _Input_ para escribir).
- ⚙️ `app/api/chat/route.ts`: Es el "Backend" de nuestro chat. Esta ruta recibe los mensajes del usuario y es donde deberás conectar la lógica para que la Inteligencia Artificial devuelva una respuesta.
- 🧠 `app/store/conversation.ts`: Aquí se guarda la memoria de la conversación actual utilizando Zustand.
- 🪝 `app/hooks/useConversation.ts`: Contiene la lógica que conecta la interfaz gráfica (frontend) con la ruta de la API (backend).

> **Tip para el equipo:** Si necesitan modificar cómo se ven los mensajes, revisen `app/page.tsx`. Si necesitan cambiar qué responde la IA, revisen `app/api/chat/route.ts`.



## Fase 1: Hardening de API y Entorno
En esta primera etapa, el objetivo principal fue mitigar las vulnerabilidades críticas del esqueleto inicial, asegurando que las API Keys estén protegidas y que el acceso al sistema esté restringido únicamente a usuarios autorizados.

## Medidas de Seguridad Implementadas

- Migración de Secretos: Se eliminaron las credenciales del código fuente y se migraron a variables de entorno (.env.local), asegurando que la API Key de la IA (Groq) nunca viaje al frontend ni quede expuesta en el repositorio.

Archivos clave: .env.local, .gitignore y application/command/AddMessageHandler.ts

- Autenticación OIDC: Se integró Clerk como proveedor de identidad, utilizando el estándar OpenID Connect (OIDC) para validar de forma confiable quién es el usuario mediante un ID Token (JWT).

Archivos clave: app/layout.tsx y app/Header.tsx

- Autorización OAuth 2.0: Se implementaron flujos de autorización para delegar el acceso a proveedores externos (Google), garantizando que la aplicación reciba tokens de acceso seguros sin almacenar contraseñas locales.

Archivos clave: middleware.ts y la consola de configuración de Clerk

- Protección de Rutas (Middleware): Se configuró un Middleware de seguridad en Next.js que intercepta cada petición; si el usuario no posee una sesión válida, el sistema deniega el acceso al Chat y a la lista de estudiantes.

Archivos clave: middleware.ts, app/page.tsx y app/students/page.tsx

- Blindaje de la API: Las rutas de backend (/api/chat y /api/students) fueron reforzadas con validaciones de servidor que responden con un estado 401 Unauthorized si no detectan un userId autenticado.

Archivos clave: app/api/chat/route.ts y app/api/students/list/route.ts

- Control de Acceso Basado en Roles (RBAC): Se implementó una capa de autorización granular donde el acceso al listado de estudiantes está restringido exclusivamente a usuarios con el rol docente o admin. Esta validación se realiza de forma doble: tanto en el frontend para mejorar la experiencia de usuario, como en el backend mediante la inspección de los metadatos del usuario en el servidor, devolviendo un 403 Forbidden ante intentos de acceso no autorizados.

Archivos clave: app/api/students/list/route.ts y app/students/page.tsx

- Evolución a Control de Acceso Basado en Permisos (PBAC) y Arquitectura Limpia:
Se refactorizó el sistema de autorización, migrando de un modelo rígido de roles (RBAC) a un modelo granular y escalable basado en permisos específicos (ej. read:students). 

Para mantener el código mantenible la lógica de validación se extrajo a un módulo centralizado. El backend interactúa de manera segura con los metadatos públicos (publicMetadata) en la base de datos de Clerk, devolviendo un 403 Forbidden absoluto ante cualquier solicitud que carezca de los privilegios exactos.

Archivos clave: app/api/students/list/route.ts, app/lib/auth.ts y app/hooks/usePermissions.ts