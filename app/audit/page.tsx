"use client"

import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { AuthPrompt } from "@/app/components/AuthPrompt"
import { usePermissions } from "@/app/hooks/usePermissions"

interface AuditEntry {
  id: number
  timestamp: string
  user_id: string
  user_email: string
  action: string
  resource: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
}

const ACTION_COLORS: Record<string, string> = {
  READ_DNI: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",
  LIST_STUDENTS: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${cls}`}>
      {action}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  })
}

export default function AuditPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { hasPermission, isLoaded: permissionsLoaded } = usePermissions()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/audit?limit=100")
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setEntries(data.entries)
      setLastRefresh(new Date())
    } catch {
      setError("No se pudieron cargar los logs de auditoría.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isUserLoaded || !permissionsLoaded) return
    if (!user || !hasPermission("read:audit_logs")) {
      setIsLoading(false)
      return
    }
    fetchLogs()
  }, [user, isUserLoaded, permissionsLoaded, hasPermission, fetchLogs])

  if (!isUserLoaded || !permissionsLoaded) return null

  if (!user) {
    return <AuthPrompt title="Inicia sesión para continuar" message="Debes ingresar con tu cuenta para ver los logs de auditoría." />
  }

  if (!hasPermission("read:audit_logs")) {
    return (
      <main className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-zinc-600 dark:text-zinc-400">No tienes el permiso <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">read:audit_logs</code> para ver esta página.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full overflow-hidden">
      <div className="flex flex-col w-full max-w-6xl flex-1 bg-white dark:bg-zinc-900/50 shadow-sm border-x border-zinc-200 dark:border-zinc-800 overflow-hidden">

        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Audit Log</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Registro de accesos a datos sensibles. Equivalente funcional de pgAudit.
            </p>
            {lastRefresh && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Última actualización: {formatDate(lastRefresh.toISOString())}
              </p>
            )}
          </div>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex-shrink-0 text-sm px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400 gap-3">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando logs...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 gap-2">
              <p>No hay registros de auditoría aún.</p>
              <p className="text-xs">Los registros aparecen aquí cuando alguien consulta un DNI.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Acción</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Recurso</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{entry.user_email}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[200px]">{entry.user_id}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {entry.resource}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {entry.ip_address ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500">
            {entries.length} registro{entries.length !== 1 ? "s" : ""} — mostrando los 100 más recientes
          </div>
        )}
      </div>
    </main>
  )
}
