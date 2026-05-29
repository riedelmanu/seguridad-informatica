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

## Fase 2: Configuración de WAF Rules (Web Application Firewall)
En esta fase, se implementó seguridad a nivel de red utilizando el Firewall de Vercel, diseñando reglas específicas para mitigar ataques automatizados y abuso de recursos.

   1. Anti-Spam & Cost Control (Rate Limiting por IP)
   2. Geo-Fencing (Reducción de Superficie de Ataque)
   3. Restrict API to Frontend (Control de Origen)

## Fase 3: Prevención de Prompt Injection (Auditoría de IA)
En esta etapa, nos enfocamos en blindar la comunicación con el LLM (Groq) limitando su alcance estrictamente al ámbito académico y previniendo ataques de manipulación.

- Validación de Entrada Estricta: Se implementó una capa de validación en el servidor que rechaza mensajes vacíos o excesivamente largos, previniendo ataques de desbordamiento en el prompt.

- Patrón Dual-LLM (Prompt Guardian): Se integró un modelo secundario que actúa como escudo previo. Evalúa la intención del usuario y bloquea la solicitud si detecta intentos de extracción de directivas o cambio de rol.

- Aislamiento de Contexto: Se emplea criptografía nativa crypto para generar delimitadores aleatorios en cada petición. Las instrucciones del usuario se encapsulan, instruyendo al LLM a tratar ese contenido estrictamente como *datos*.

- Sanitización de Salida: Un filtro final intercepta la respuesta de la IA. Si intenta imprimir secretos o delimitadores internos, el sistema censura el mensaje.


## Hardening del Repositorio
Adicionalmente, implementamos medidas de seguridad:

- Análisis Estático (SAST) con CodeQL: Se integró mediante GitHub Actions para escanear automáticamente cada Pull Request en busca de vulnerabilidades estructurales.
- Branch Protection: Se bloqueó el Push directo a main. Todo código requiere un PR, aprobación de dos integrantes y superar el análisis de CodeQL.
- Security Policy: Se añadió un SECURITY.md definiendo versiones soportadas y protocolos de reporte de vulnerabilidades.

---

## Fase 4: Persistencia Segura, Criptografía en Reposo y Auditoría

En esta fase culminante se reemplazó por completo el almacenamiento efímero en memoria por una base de datos relacional PostgreSQL alojada en Supabase, incorporando tres pilares de seguridad de nivel productivo: **prevención de SQL Injection**, **criptografía simétrica en reposo** y un **sistema de auditoría dual** equivalente a pgAudit.

---

### 4.1 Integración con Supabase y Patrón Singleton

El primer desafío en entornos Serverless (Next.js desplegado en Vercel) es la gestión eficiente de conexiones: cada invocación de una ruta API puede crear una instancia nueva del cliente, agotando el pool de conexiones de PostgreSQL bajo carga.

**Solución — Patrón Singleton:**
Se configuró el cliente de Supabase como una única instancia compartida por todo el proceso. Al ejecutarse estrictamente del lado del servidor, la clave privilegiada `SUPABASE_SERVICE_ROLE_KEY` nunca viaja al cliente; las validaciones PBAC actúan como barrera antes de que el handler toque la base de datos.

```
📁 infrastructure/database/supabaseClient.ts     ← Singleton con service role key (RLS bypass por la clave, no por el patrón)
📁 infrastructure/database/supabaseAnonClient.ts ← Cliente anon con JWT del usuario (respeta RLS)
📁 infrastructure/repositories/StudentRepository.ts
📁 infrastructure/repositories/AuditLogRepository.ts
```

**Control de versiones con migraciones:**
La evolución del esquema (tabla `students`, triggers para `updated_at`, tabla `app_audit_log`) se gestionó mediante archivos SQL secuenciales en `supabase/migrations/`. Esto garantiza reproducibilidad y elimina modificaciones manuales no documentadas en producción.

---

### 4.2 Prevención de SQL Injection — Defensa en Profundidad

Un atacante que controle el parámetro `id` de la ruta `/api/students/:id/dni` podría intentar inyectar SQL para exfiltrar toda la tabla. La defensa opera en **dos capas independientes**:

**Capa 1 — WAF en el borde (Vercel Firewall):**
Antes de que la petición llegue siquiera a Next.js, una regla de firewall valida el formato del parámetro mediante expresión regular (`^\d{7,8}$`). Cualquier carácter anómalo (`'`, `--`, `OR`, `1=1`) recibe un `HTTP 403` en el borde de red.

**Capa 2 — Prepared Statements en la aplicación:**
El query builder nativo de Supabase parametriza automáticamente todas las consultas enviadas a PostgreSQL. El código SQL ejecutable nunca se mezcla con los datos de entrada, neutralizando la posibilidad de que una cadena maliciosa altere la semántica de la consulta.

```
📁 infrastructure/repositories/StudentRepository.ts   ← Consultas parametrizadas via Supabase SDK
📁 app/api/students/[id]/dni/route.ts                 ← Validación de formato antes del handler
```

> La clave del concepto: aunque un atacante evada el WAF, los Prepared Statements en la capa de aplicación constituyen una segunda línea de defensa independiente.

#### Cómo probarlo — Guía paso a paso

##### Cómo obtener tu token de sesión (solo necesario si querés probar con usuario autenticado)

1. Abrí la app en el navegador y **iniciá sesión** con tu cuenta de Google
2. Abrí las **DevTools** (`F12`)
3. Andá a la pestaña **Application** → **Cookies** → seleccioná el dominio (`localhost:3000` o `seguridad-informatica-black.vercel.app`)
4. Buscá la cookie llamada `__session` y **copiá su valor**

Ese valor es el JWT de Clerk. Usalo así en los comandos:

> **Importante — sintaxis en PowerShell:** `curl` en PowerShell es un alias de `Invoke-WebRequest` y no acepta `-H`. Usá `curl.exe` (el curl real de Windows) con `--header`:

```powershell
curl.exe "http://localhost:3000/api/students/1/dni" --header "Cookie: __session=PEGAR_VALOR_AQUI"
```

> Sin el token obtenés **401**. Con el token pero sin el permiso `read:student_dni` en tu usuario de Clerk obtenés **403**. Con token y permiso obtenés **200** con el DNI descifrado.

---

Las pruebas se dividen en dos entornos porque cada uno demuestra una capa distinta:

| Entorno | Qué demuestra | Cómo correrlo |
|---|---|---|
| **Producción** (Vercel) | WAF bloqueando en el borde (Capa 1) | `curl` sin token, sin login |
| **Local** (`localhost:3000`) | `parseInt` + Prepared Statements (Capa 2) | `npm run dev`, luego `curl` sin token |

---

##### Pruebas en Producción — WAF (Capa 1)

No necesitás login. El WAF actúa antes de que la petición llegue a Next.js.

**Prueba A — Payload clásico `OR 1=1`**
```powershell
curl "https://seguridad-informatica-black.vercel.app/api/students/1%20OR%201%3D1/dni"
```
Resultado real: **`403 Forbidden`** — el WAF detectó el patrón `OR 1=1` y bloqueó en el borde.

**Prueba B — DROP TABLE**
```powershell
curl "https://seguridad-informatica-black.vercel.app/api/students/1%3BDROP%20TABLE%20students--/dni"
```
Resultado real: **`403 Forbidden`** — el WAF detectó el `;` y `DROP TABLE`.

**Prueba C — Request legítima desde curl (sin origen de browser)**
```powershell
curl "https://seguridad-informatica-black.vercel.app/api/students/1/dni"
```
Resultado real: **`403 Forbidden`** — la regla "Restrict API to Frontend" bloquea cualquier request que no provenga del navegador (sin headers `Origin`/`Referer` del dominio). Esto demuestra que el WAF tiene múltiples reglas activas simultáneamente.

---

##### Pruebas en Local — Capa de Aplicación (Capa 2)

Primero levantá el servidor:
```powershell
npm run dev
```

En local no hay WAF, por lo que los payloads llegan directamente a la aplicación. No hace falta token para ver cómo responde la ruta.

**Prueba D — `OR 1=1` (texto puro, sin número al inicio)**
```powershell
curl "http://localhost:3000/api/students/'%20OR%201%3D1/dni"
```
Resultado real: **`401 Unauthorized`** — `parseInt("' OR 1=1")` devuelve `NaN`, la ruta devuelve 400... pero antes de eso, la capa de autenticación Clerk devuelve 401 porque no hay sesión. El payload nunca toca la BD.

**Prueba E — DROP TABLE (el caso más didáctico)**
```powershell
curl "http://localhost:3000/api/students/1%3BDROP%20TABLE%20students--/dni"
```
Resultado real: **`401 Unauthorized`**

Acá está el punto clave: `parseInt("1;DROP TABLE students--")` devuelve **`1`** — el número es válido y pasa la validación de formato. Sin embargo:
1. Clerk devuelve 401 (sin sesión) → el DROP nunca llega a Supabase
2. Si hubiera sesión, el SDK parametrizaría la query: el `;DROP...` se trataría como **dato**, no como SQL ejecutable

Esto prueba por qué `parseInt` solo **no es suficiente**: un atacante autenticado con esa URL llegaría a Supabase, y son los Prepared Statements los que neutralizan el ataque en última instancia.

> **Conclusión de las pruebas:** en producción el WAF es tan agresivo que la Capa 2 raramente se ejerce. Pero si el WAF falla o se bypasea, los Prepared Statements son la red de seguridad real. Eso es Defensa en Profundidad.

---

### 4.3 Criptografía en Reposo con PGCRYPTO

Los DNIs son **Información de Identificación Personal (PII)**. Almacenarlos en texto plano significa que cualquier acceso no autorizado a la base de datos (backup filtrado, credenciales comprometidas) expone todos los datos de forma inmediata.

**Solución — Cifrado simétrico PGP directamente en PostgreSQL:**

Se activó la extensión oficial `pgcrypto` en Supabase y se diseñaron funciones `SECURITY DEFINER` que encapsulan las operaciones de cifrado/descifrado. En lugar de permitir escrituras o lecturas directas sobre las columnas cifradas, toda interacción pasa por estas funciones:

- **Al insertar:** la función recibe el DNI en texto plano y la clave AES-256 (proveniente de `SUPABASE_ENCRYPTION_KEY` en el servidor), almacenando únicamente el texto cifrado en disco.
- **Al leer:** la función ejecuta la operación inversa; el DNI legible **nunca se escribe en disco de forma permanente**, existiendo únicamente en memoria volátil del servidor durante la transmisión de la consulta.

```
📁 supabase/migrations/   ← Activación de pgcrypto + funciones SECURITY DEFINER de encrypt/decrypt
📁 infrastructure/repositories/StudentRepository.ts   ← Llama a las funciones, inyecta la clave en runtime
📁 app/api/students/[id]/dni/route.ts                 ← Endpoint que expone el DNI descifrado bajo PBAC
```

> El dato sensible **nunca toca el disco en texto plano**. La clave criptográfica se inyecta en el momento exacto de la transacción y vive solo en la variable de entorno del servidor.

---

### 4.4 Auditoría y Trazabilidad — Sistema Dual (Equivalente a pgAudit)

El cifrado protege el dato en reposo, pero no responde una pregunta crítica: **¿quién accedió, cuándo y desde dónde?** Sin trazabilidad, un actor interno con acceso legítimo podría exfiltrar DNIs masivamente sin dejar rastro.

Se implementó un sistema de auditoría en **dos niveles complementarios**:

#### Nivel 1 — Trigger de base de datos (mutaciones: INSERT / UPDATE / DELETE)

Un trigger PostgreSQL intercepta cualquier cambio en las tablas de la aplicación y registra automáticamente el evento en un log estructurado. El desafío en entornos con conexión compartida de API es identificar **quién** hizo el cambio; se resuelve inspeccionando el JWT de sesión activo en Supabase Auth para extraer el `user_id` real.

```
📁 supabase/migrations/   ← Definición del trigger + función de auditoría de mutaciones
```

#### Nivel 2 — Audit log de aplicación (lecturas de PII)

Los triggers tradicionales son **ciegos ante SELECT**: un atacante con acceso legítimo podría hacer scraping masivo de DNIs sin alterar ningún registro. Para cerrar este vector, cada vez que el endpoint descifra un DNI bajo demanda, el handler registra la operación en `app_audit_log` **de forma no bloqueante**: si el log falla, la respuesta al usuario no se interrumpe.

```
📁 infrastructure/repositories/AuditLogRepository.ts       ← Escritura en app_audit_log
📁 application/query/GetAuditLogHandler.ts                 ← Lectura del log (Clean Architecture)
📁 app/api/students/[id]/dni/route.ts                      ← Dispara el log tras descifrar el DNI
📁 app/api/audit/route.ts                                  ← GET /api/audit (requiere read:audit_logs)
📁 app/audit/page.tsx                                      ← UI de auditoría, solo admins
```

**Campos registrados por evento:** `user_id`, `user_email`, `action`, `resource`, `ip_address`, `user_agent`, `metadata`.

> La combinación de ambos niveles garantiza cobertura total: el trigger captura toda mutación de datos aunque bypasee la aplicación; el log de aplicación captura toda lectura de PII aunque no modifique ningún registro.