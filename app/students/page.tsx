"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useStudents } from "@/app/hooks/useStudents"
import { useStudentsStore, Student } from "@/app/store/students"
import { useUser } from "@clerk/nextjs"
import { AuthPrompt } from "@/app/components/AuthPrompt"
import { usePermissions } from "@/app/hooks/usePermissions"

const DNI_VISIBLE_SECONDS = 5

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const sirenOsc = ctx.createOscillator()
    const sirenGain = ctx.createGain()
    sirenOsc.connect(sirenGain)
    sirenGain.connect(ctx.destination)
    sirenGain.gain.setValueAtTime(0.18, ctx.currentTime)
    sirenOsc.frequency.setValueAtTime(440, ctx.currentTime)
    sirenOsc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.4)
    sirenOsc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.8)
    sirenOsc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 1.2)
    sirenOsc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.6)
    sirenGain.gain.setValueAtTime(0.18, ctx.currentTime + 1.5)
    sirenGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8)
    sirenOsc.start(ctx.currentTime)
    sirenOsc.stop(ctx.currentTime + 1.8)
    for (let i = 0; i < 4; i++) {
      const beep = ctx.createOscillator()
      const beepGain = ctx.createGain()
      beep.connect(beepGain)
      beepGain.connect(ctx.destination)
      beep.type = "square"
      beep.frequency.setValueAtTime(1200, ctx.currentTime + i * 0.25)
      beepGain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.25)
      beepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.15)
      beep.start(ctx.currentTime + i * 0.25)
      beep.stop(ctx.currentTime + i * 0.25 + 0.15)
    }
  } catch { /* silencioso si el navegador bloquea */ }
}

function playHideSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* silencioso */ }
}

function DniDisplay({ value, countdown }: { value: string | null; countdown: number }) {
  const pct = (countdown / DNI_VISIBLE_SECONDS) * 100
  const isUrgent = countdown <= 2

  return (
    <div className="relative mt-1">
      <div
        className="absolute inset-0 rounded-md -m-1 pointer-events-none"
        style={{
          background: isUrgent
            ? `rgba(239,68,68,${0.08 + (1 - countdown / 2) * 0.12})`
            : "rgba(234,179,8,0.06)",
          animation: isUrgent ? "dniPulse 0.4s ease-in-out infinite" : "dniPulse 1s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 rounded pointer-events-none overflow-hidden" style={{ mixBlendMode: "overlay" }}>
        <div style={{
          position: "absolute", width: "100%", height: "2px",
          background: isUrgent ? "rgba(239,68,68,0.7)" : "rgba(234,179,8,0.6)",
          animation: "dniScan 0.8s linear infinite",
        }} />
      </div>
      <p className="text-xs mt-0.5 relative" style={{ animation: isUrgent ? "dniGlitch 0.15s infinite" : "dniGlitch 0.6s infinite" }}>
        <span className="text-zinc-400 dark:text-zinc-500">DNI: </span>
        <span className="font-mono font-bold tracking-widest" style={{
          color: isUrgent ? "#ef4444" : "#eab308",
          textShadow: isUrgent
            ? "0 0 8px #ef4444, 0 0 16px #ef444488, 1px 0 0 rgba(0,255,255,0.35), -1px 0 0 rgba(255,0,255,0.35)"
            : "0 0 6px #eab308, 0 0 12px #eab30888",
          letterSpacing: "0.25em",
        }}>
          {value ?? "—"}
        </span>
      </p>
      <div className="mt-1 h-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{
          width: `${pct}%`,
          background: isUrgent ? "linear-gradient(90deg, #ef4444, #ff6b6b)" : "linear-gradient(90deg, #eab308, #f59e0b)",
          boxShadow: isUrgent ? "0 0 6px #ef4444" : "0 0 6px #eab308",
        }} />
        {isUrgent && <div className="absolute right-0 top-0 h-full w-4 pointer-events-none" style={{ animation: "dniParticle 0.3s ease-out infinite" }} />}
      </div>
      <p className="text-xs mt-0.5 font-mono" style={{ color: isUrgent ? "#ef4444" : "#a1a1aa", animation: isUrgent ? "dniShake 0.1s infinite" : "none" }}>
        {isUrgent ? "⚠ " : ""}Se oculta en {countdown}s{isUrgent ? " ⚠" : ""}
      </p>
    </div>
  )
}

export default function StudentsPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { fetchStudents } = useStudents()
  const { students } = useStudentsStore()
  const [isLoading, setIsLoading] = useState(true)
  const { hasPermission, isLoaded: permissionsLoaded } = usePermissions()
  const [revealedDnis, setRevealedDnis] = useState<Record<number, string | null>>({})
  const [loadingDni, setLoadingDni] = useState<Record<number, boolean>>({})
  const [dniCountdowns, setDniCountdowns] = useState<Record<number, number>>({})
  const timersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({})

  const hideDni = useCallback((studentId: number) => {
    clearInterval(timersRef.current[studentId])
    delete timersRef.current[studentId]
    playHideSound()
    setRevealedDnis(prev => { const next = { ...prev }; delete next[studentId]; return next })
    setDniCountdowns(prev => { const next = { ...prev }; delete next[studentId]; return next })
  }, [])

  useEffect(() => {
    if (!isUserLoaded || !permissionsLoaded) return
    if (!user || !hasPermission("read:students")) { setIsLoading(false); return }
    const loadStudents = async () => {
      try { await fetchStudents() }
      catch (error) { console.error("Error fetching students:", error) }
      finally { setIsLoading(false) }
    }
    loadStudents()
  }, [user, isUserLoaded, permissionsLoaded, hasPermission, fetchStudents])

  useEffect(() => {
    const timers = timersRef.current
    return () => { Object.values(timers).forEach(clearInterval) }
  }, [])

  const handleRevealDni = async (studentId: number) => {
    if (revealedDnis[studentId] !== undefined) { hideDni(studentId); return }
    setLoadingDni(prev => ({ ...prev, [studentId]: true }))
    try {
      const res = await fetch(`/api/students/${studentId}/dni`)
      if (!res.ok) throw new Error('Sin permiso')
      const data = await res.json()
      playAlarmSound()
      setRevealedDnis(prev => ({ ...prev, [studentId]: data.dni }))
      setDniCountdowns(prev => ({ ...prev, [studentId]: DNI_VISIBLE_SECONDS }))
      let remaining = DNI_VISIBLE_SECONDS
      timersRef.current[studentId] = setInterval(() => {
        remaining -= 1
        if (remaining <= 0) { hideDni(studentId) }
        else { setDniCountdowns(prev => ({ ...prev, [studentId]: remaining })) }
      }, 1000)
    } catch {
      setRevealedDnis(prev => ({ ...prev, [studentId]: null }))
    } finally {
      setLoadingDni(prev => ({ ...prev, [studentId]: false }))
    }
  }

  if (!isUserLoaded || !permissionsLoaded) return null

  if (!user) {
    return <AuthPrompt title="Inicia sesión para continuar" message="Debes ingresar con tu cuenta para ver los estudiantes." />
  }

  if (!hasPermission("read:students")) {
    return (
      <main className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-zinc-600 dark:text-zinc-400">No tienes los permisos necesarios para ver esta página.</p>
        </div>
      </main>
    )
  }

  const canSeeDni = hasPermission("read:student_dni")

  return (
    <>
      <style>{`
        @keyframes dniPulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.01); } }
        @keyframes dniScan { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes dniGlitch {
          0%, 90%, 100% { transform: translate(0,0) skew(0deg); }
          92% { transform: translate(-2px,0) skew(-1deg); filter: hue-rotate(90deg); }
          94% { transform: translate(2px,0) skew(1deg); }
          96% { transform: translate(-1px,1px) skew(0.5deg); filter: hue-rotate(-90deg); }
          98% { transform: translate(0,0) skew(0deg); filter: none; }
        }
        @keyframes dniShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        @keyframes dniParticle { 0% { box-shadow: 0 0 4px 2px #ef4444; opacity: 1; } 100% { box-shadow: 0 0 0px 0px #ef4444; opacity: 0; } }
      `}</style>
      <main className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full overflow-hidden">
        <div className="flex flex-col w-full max-w-4xl flex-1 bg-white dark:bg-zinc-900/50 shadow-sm border-x border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Listado de Estudiantes</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Esta es la lista de estudiantes actualmente en el sistema.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando estudiantes...
              </div>
            ) : students.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">No se encontraron estudiantes.</div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {students.map((student: Student) => (
                  <li key={student.id} className="p-4 sm:p-6 transition-colors" style={{
                    background: revealedDnis[student.id] !== undefined
                      ? dniCountdowns[student.id] <= 2 ? "rgba(239,68,68,0.04)" : "rgba(234,179,8,0.03)"
                      : undefined,
                  }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all" style={{
                          background: revealedDnis[student.id] !== undefined
                            ? dniCountdowns[student.id] <= 2 ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.15)"
                            : "rgb(228 228 231)",
                          boxShadow: revealedDnis[student.id] !== undefined
                            ? dniCountdowns[student.id] <= 2 ? "0 0 12px rgba(239,68,68,0.5)" : "0 0 8px rgba(234,179,8,0.4)"
                            : undefined,
                        }}>
                          <span className="text-lg font-medium" style={{
                            color: revealedDnis[student.id] !== undefined
                              ? dniCountdowns[student.id] <= 2 ? "#ef4444" : "#eab308"
                              : "#71717a",
                          }}>
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.email}</p>
                          {canSeeDni && revealedDnis[student.id] !== undefined && dniCountdowns[student.id] !== undefined && (
                            <DniDisplay value={revealedDnis[student.id]} countdown={dniCountdowns[student.id]} />
                          )}
                        </div>
                      </div>
                      {canSeeDni && (
                        <button
                          onClick={() => handleRevealDni(student.id)}
                          disabled={loadingDni[student.id]}
                          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-md border transition-all disabled:opacity-50"
                          style={revealedDnis[student.id] !== undefined ? {
                            borderColor: dniCountdowns[student.id] <= 2 ? "#ef4444" : "#eab308",
                            color: dniCountdowns[student.id] <= 2 ? "#ef4444" : "#eab308",
                            background: dniCountdowns[student.id] <= 2 ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.08)",
                            boxShadow: dniCountdowns[student.id] <= 2 ? "0 0 8px rgba(239,68,68,0.4)" : "0 0 6px rgba(234,179,8,0.3)",
                          } : { borderColor: "#d4d4d8", color: "#71717a" }}
                        >
                          {loadingDni[student.id] ? '...' : revealedDnis[student.id] !== undefined ? 'Ocultar DNI' : 'Ver DNI'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
