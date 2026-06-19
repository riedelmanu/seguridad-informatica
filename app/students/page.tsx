"use client"

import { useEffect, useRef, useState, useCallback, FormEvent } from "react"
import { useStudents } from "@/app/hooks/useStudents"
import { useStudentsStore, Student } from "@/app/store/students"
import { useUser } from "@clerk/nextjs"
import { AuthPrompt } from "@/app/components/AuthPrompt"
import { usePermissions } from "@/app/hooks/usePermissions"
import { useStudentApi } from "@/app/lib/clients/useStudentApi"

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
  const { students, setStudents, addStudent } = useStudentsStore()
  const [isLoading, setIsLoading] = useState(true)
  const { hasPermission, isLoaded: permissionsLoaded } = usePermissions()
  const [revealedDnis, setRevealedDnis] = useState<Record<number, string | null>>({})
  const [loadingDni, setLoadingDni] = useState<Record<number, boolean>>({})
  const [dniCountdowns, setDniCountdowns] = useState<Record<number, number>>({})
  const timersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({})

  const [revealedDetails, setRevealedDetails] = useState<Record<number, string | null>>({})
  const [loadingDetail, setLoadingDetail] = useState<Record<number, boolean>>({})
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [editDetailValue, setEditDetailValue] = useState<string>("")
  const [isSavingDetail, setIsSavingDetail] = useState<boolean>(false)

  const { searchStudents, getStudentsList, getStudentDetail, updateStudentDetail, createStudent } = useStudentApi()
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newDni, setNewDni] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const resetCreateForm = () => {
    setNewName("")
    setNewEmail("")
    setNewDni("")
    setCreateError(null)
  }

  const handleCreateStudent = async (e: FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      const res = await createStudent({
        name: newName,
        email: newEmail,
        dni: newDni.trim() === "" ? undefined : newDni.trim(),
      })
      addStudent(res.student)
      setShowCreateModal(false)
      resetCreateForm()
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || "No se pudo crear el estudiante."
      setCreateError(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevealDetail = async (studentId: number) => {
    if (revealedDetails[studentId] !== undefined) {
      setRevealedDetails(prev => { const next = { ...prev }; delete next[studentId]; return next })
      if (editingStudentId === studentId) {
        setEditingStudentId(null)
      }
      return
    }
    setLoadingDetail(prev => ({ ...prev, [studentId]: true }))
    try {
      const res = await getStudentDetail(studentId)
      setRevealedDetails(prev => ({ ...prev, [studentId]: res.detail }))
    } catch (err) {
      console.error("Error fetching student detail:", err)
    } finally {
      setLoadingDetail(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const handleSaveDetail = async (studentId: number) => {
    setIsSavingDetail(true)
    try {
      await updateStudentDetail(studentId, editDetailValue)
      setRevealedDetails(prev => ({ ...prev, [studentId]: editDetailValue }))
      setEditingStudentId(null)
    } catch (err: any) {
      console.error("Error saving student detail:", err)
      const errorMsg = err?.error || err?.message || String(err)
      alert("Error al guardar la descripción: " + errorMsg)
    } finally {
      setIsSavingDetail(false)
    }
  }

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
    if (searchTerm === "") {
      const loadAll = async () => {
        if (!user || !hasPermission("read:students")) return
        try {
          const res = await getStudentsList()
          setStudents(res.list)
        } catch (err) {
          console.error("Error loading students list:", err)
        }
      }
      loadAll()
    }
  }, [searchTerm, getStudentsList, setStudents, user, hasPermission])

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    setIsSearching(true)
    try {
      if (searchTerm.trim() === "") {
        const res = await getStudentsList()
        setStudents(res.list)
      } else {
        const res = await searchStudents(searchTerm.trim())
        setStudents(res.list)
      }
    } catch (error) {
      console.error("Error searching students:", error)
    } finally {
      setIsSearching(false)
    }
  }

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

  const canCreate = hasPermission("create:students")
  const canSeeDni = hasPermission("read:student_dni")
  const canSeeDetail = hasPermission("read:student_detail") || hasPermission("read:students")
  const canEditDetail = hasPermission("write:student_detail") || hasPermission("read:student_dni")

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
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Listado de Estudiantes</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Esta es la lista de estudiantes actualmente en el sistema.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
            {canCreate && (
              <button
                type="button"
                onClick={() => { resetCreateForm(); setShowCreateModal(true) }}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Dar de alta
              </button>
            )}
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:max-w-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg pl-9 pr-4 py-2 text-sm border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all"
                  disabled={isSearching}
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {isSearching ? "..." : "Buscar"}
              </button>
            </form>
            </div>
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
                    <div className="flex flex-col gap-3">
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

                      {canSeeDetail && (
                        <div className="mt-2 pt-2 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                          {revealedDetails[student.id] !== undefined ? (
                            editingStudentId === student.id ? (
                              <div className="flex flex-col gap-2">
                                <textarea
                                  value={editDetailValue}
                                  onChange={(e) => setEditDetailValue(e.target.value)}
                                  className="w-full text-xs p-2 rounded border bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                                  rows={3}
                                  maxLength={500}
                                  placeholder="Escribe una descripción sobre el alumno..."
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingStudentId(null)}
                                    disabled={isSavingDetail}
                                    className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveDetail(student.id)}
                                    disabled={isSavingDetail}
                                    className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isSavingDetail ? 'Guardando...' : 'Guardar'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-mono">Descripción del Alumno</span>
                                    <button
                                      onClick={() => handleRevealDetail(student.id)}
                                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                                    >
                                      Ocultar
                                    </button>
                                  </div>
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                                    {revealedDetails[student.id] || "Sin descripción disponible."}
                                  </p>
                                </div>
                                {canEditDetail && (
                                  <button
                                    onClick={() => {
                                      setEditingStudentId(student.id)
                                      setEditDetailValue(revealedDetails[student.id] || "")
                                    }}
                                    className="text-xs font-semibold px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 mt-1"
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            <button
                              onClick={() => handleRevealDetail(student.id)}
                              disabled={loadingDetail[student.id]}
                              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1.5 transition-all"
                            >
                              {loadingDetail[student.id] ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {loadingDetail[student.id] ? 'Cargando...' : 'Ver descripción'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {canCreate && showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!isCreating) { setShowCreateModal(false); resetCreateForm() } }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Dar de alta estudiante</h3>
              <button
                onClick={() => { if (!isCreating) { setShowCreateModal(false); resetCreateForm() } }}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="Nombre y apellido"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="estudiante@example.com"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  DNI <span className="font-normal text-zinc-400">(opcional, se almacena cifrado)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newDni}
                  onChange={(e) => setNewDni(e.target.value)}
                  maxLength={8}
                  placeholder="Ej: 43521876"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:outline-none transition-all font-mono"
                />
              </div>

              {createError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetCreateForm() }}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear estudiante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
