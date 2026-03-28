"use client"

import { SignInButton } from "@clerk/nextjs"

export function AuthPrompt({ title = "Inicia sesión para continuar", message = "Debes ingresar con tu cuenta para ver el contenido." }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-6 rounded-xl shadow text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">{title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{message}</p>
        <SignInButton mode="redirect">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Ir a iniciar sesión
          </button>
        </SignInButton>
      </div>
    </main>
  )
}
