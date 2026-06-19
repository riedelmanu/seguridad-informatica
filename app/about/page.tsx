import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Secure Campus IA",
  description:
    "Somos un grupo de estudiantes de Ingeniería en Sistemas de Información que desarrollamos Secure Campus IA para la materia de Seguridad en Sistemas de Información.",
};

const TEAM = [
  { name: "Basgall, Juan Ignacio", linkedin: "https://www.linkedin.com/in/juan-basgall-5a1583299/" },
  { name: "Brun, Juan", linkedin: "https://www.linkedin.com/in/juan-brun-064539329/" },
  { name: "Chiappella, Juan Ignacio", linkedin: "https://www.linkedin.com/in/jchiappella/" },
  { name: "Riedel, Manuel Ángel", linkedin: "https://www.linkedin.com/in/manuel-riedel-997383255/" },
  { name: "Turin, Brian", linkedin: "https://www.linkedin.com/in/brian-emanuel-turin-barragan-5131b7235/" },
];

const IMG = "/about-us-team.webp";

function Badge() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-100 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      About Us
    </span>
  );
}

function TitleContent() {
  return (
    <>
      <Badge />
      <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
        Quiénes somos
      </h1>
    </>
  );
}

function DescContent() {
  return (
    <div className="space-y-3 [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
      <p className="text-sm sm:text-base leading-relaxed text-zinc-100">
        Somos un grupo de estudiantes que desarrollamos{" "}
        <strong className="text-white">Secure Campus IA</strong> como proyecto para la
        materia de <strong className="text-white">Seguridad en Sistemas de Información</strong>{" "}
        de <strong className="text-white">5º año</strong> de{" "}
        <strong className="text-white">Ingeniería en Sistemas de Información</strong>.
      </p>
      <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
        Un trabajo académico que demuestra, de forma práctica y progresiva, múltiples
        capas de seguridad: autenticación, autorización por permisos, defensa contra
        prompt injection, restricción de dominio educativo y auditoría de accesos.
      </p>
    </div>
  );
}

function TeamContent() {
  return (
    <>
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-3 [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
        Integrantes del equipo
      </h2>
      <ul className="space-y-2">
        {TEAM.map(({ name, linkedin }) => {
          const initial = name.replace(/^[^,]+,\s*/, "").charAt(0).toUpperCase();
          return (
            <li key={name}>
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg bg-black/35 backdrop-blur-sm ring-1 ring-white/10 px-3 py-2 transition hover:bg-black/50 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-white/15 text-white text-sm font-semibold group-hover:bg-emerald-400/20">
                  {initial}
                </span>
                <span className="text-sm font-medium text-zinc-50 group-hover:text-white group-hover:underline">
                  {name}
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-auto h-4 w-4 flex-shrink-0 text-zinc-400 transition group-hover:text-[#0a66c2]"
                >
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function AboutPage() {
  return (
    <main className="relative w-full flex-1 min-h-0 overflow-hidden">
      <style>{`
        @keyframes aboutReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .about-reveal { opacity: 0; animation: aboutReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .about-reveal { opacity: 1; animation: none; }
        }
      `}</style>

      {/* Foto de fondo nítida (centro) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMG}
        alt="El equipo de Secure Campus IA en la oficina"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Bordes con difuminado apenas suave: misma imagen desenfocada, visible solo en el borde */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          WebkitMaskImage:
            "radial-gradient(ellipse 82% 82% at 50% 50%, transparent 62%, #000 90%)",
          maskImage:
            "radial-gradient(ellipse 82% 82% at 50% 50%, transparent 62%, #000 90%)",
        }}
      />

      {/* Viñeta + scrim para legibilidad del texto */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%), linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 65%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Scrim lateral derecho (escritorio): ancla la columna de integrantes sobre la ventana luminosa */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[36%] pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* ── Layout de escritorio: texto alrededor de las personas ── */}
      <div className="absolute inset-0 z-10 hidden md:block">
        {/* Título: arriba a la izquierda */}
        <div className="about-reveal absolute top-0 left-0 p-8 lg:p-10 max-w-md flex flex-col" style={{ animationDelay: "0.05s" }}>
          <TitleContent />
        </div>

        {/* Descripción: columna izquierda, sobre los monitores */}
        <div className="about-reveal absolute left-0 bottom-0 p-8 lg:p-10 w-[clamp(240px,26vw,360px)]" style={{ animationDelay: "0.2s" }}>
          <DescContent />
        </div>

        {/* Integrantes: columna derecha, sobre la ventana */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 p-8 lg:p-10 w-[clamp(240px,26vw,340px)]">
          <div className="about-reveal" style={{ animationDelay: "0.35s" }}>
            <TeamContent />
          </div>
        </div>

        {/* Nota al pie: centro inferior */}
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-zinc-300/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Secure Campus IA · Proyecto académico · Ingeniería en Sistemas de Información
        </p>
      </div>

      {/* ── Layout móvil: apilado y desplazable, con paneles legibles ── */}
      <div className="absolute inset-0 z-10 md:hidden overflow-y-auto">
        <div className="min-h-full flex flex-col justify-between gap-6 p-6">
          <div className="flex flex-col rounded-2xl bg-black/40 backdrop-blur-sm ring-1 ring-white/10 p-5">
            <TitleContent />
            <div className="mt-4">
              <DescContent />
            </div>
          </div>
          <div className="rounded-2xl bg-black/40 backdrop-blur-sm ring-1 ring-white/10 p-5">
            <TeamContent />
          </div>
          <p className="text-center text-[11px] text-zinc-300/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
            Secure Campus IA · Proyecto académico · Ingeniería en Sistemas de Información
          </p>
        </div>
      </div>
    </main>
  );
}
