"use client";

import { useEffect, useRef, useState } from "react";
import { SignInButton } from "@clerk/nextjs";

/* ─── Animated Grid Background ────────────────────────────────────────────── */
function GridBackground() {
  return (
    <div className="landing-grid-bg">
      <div className="landing-grid-lines" />
      <div className="landing-scan-line" />
    </div>
  );
}

/* ─── Floating Particles ───────────────────────────────────────────────────── */
function Particles() {
  const COUNT = 24;
  const [positions, setPositions] = useState<number[]>([]);

  useEffect(() => {
    setPositions(Array.from({ length: COUNT }, () => Math.random() * 100));
  }, []);

  return (
    <div className="landing-particles" aria-hidden>
      {Array.from({ length: COUNT }, (_, i) => (
        <span
          key={i}
          className="landing-particle"
          style={{
            left: positions[i] !== undefined ? `${positions[i]}%` : "-100%",
            animationDelay: `${(i * 0.41) % 7}s`,
            animationDuration: `${6 + (i % 5)}s`,
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            opacity: 0.3 + (i % 4) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Typing Text ──────────────────────────────────────────────────────────── */
function TypingText({ phrases }: { phrases: string[] }) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const speed = deleting ? 38 : 68;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        if (charIdx > 0) {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        } else {
          setDeleting(false);
          setPhraseIdx((p) => (p + 1) % phrases.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases]);

  return (
    <span className="landing-typing">
      {displayed}
      <span className="landing-cursor">|</span>
    </span>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="landing-feature-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="landing-feature-icon" style={{ color }}>
        {icon}
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
    </div>
  );
}

/* ─── Main Landing Page ───────────────────────────────────────────────────── */
export function LandingPage() {
  const audioRef = useRef<AudioBuffer | null>(null);

  /* Subtle ambient synth sound on mount */
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
    } catch {
      /* AudioContext not available — silent */
    }
  }, []);

  return (
    <main className="landing-root">
      <GridBackground />
      <Particles />

      {/* ── Hero Section ── */}
      <section className="landing-hero">
        {/* Illustration */}
        <div className="landing-illustration-wrap">
          <div className="landing-illustration-glow" />
          <div className="landing-illustration-ring landing-illustration-ring-1" />
          <div className="landing-illustration-ring landing-illustration-ring-2" />
          <div className="landing-illustration-ring landing-illustration-ring-3" />
          <img
            src="/landing-page-branding.png"
            alt="Campus IA"
            className="landing-illustration"
          />
        </div>

        {/* Text block */}
        <div className="landing-hero-text">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Sistema de IA Universitaria
          </div>

          <h1 className="landing-title">
            <span className="landing-title-gradient">Secure Campus IA</span>
          </h1>

          <p className="landing-subtitle">
            <TypingText
              phrases={[
                "Aprende con inteligencia artificial.",
                "Consulta materias de forma segura.",
                "Tu asistente académico personal.",
                "Potenciado por modelos de lenguaje avanzados.",
              ]}
            />
          </p>

          <p className="landing-description">
            Una plataforma universitaria que combina IA de última generación con un
            entorno seguro y privado para estudiantes y docentes.
          </p>

          <div className="landing-cta-row">
            <SignInButton mode="redirect">
              <button className="landing-btn-primary" id="landing-signin-btn">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Iniciar sesión
              </button>
            </SignInButton>
            <button
              className="landing-btn-secondary"
              onClick={() =>
                document
                  .getElementById("landing-features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Conocer más
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="landing-stats">
            {[
              { value: "Groq", label: "Motor de IA" },
              { value: "100%", label: "Seguro" },
              { value: "24/7", label: "Disponible" },
            ].map((s) => (
              <div key={s.label} className="landing-stat">
                <span className="landing-stat-value">{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="landing-features" className="landing-features">
        <div className="landing-features-header">
          <h2 className="landing-section-title">¿Por qué elegir Campus IA?</h2>
          <p className="landing-section-subtitle">
            Diseñado para el ecosistema universitario moderno
          </p>
        </div>

        <div className="landing-features-grid">
          <FeatureCard
            delay={0}
            color="#5B8ECA"
            title="Chat Inteligente"
            description="Conversa con una IA especializada en tu carrera. Obtén respuestas precisas sobre materias, proyectos y dudas académicas."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
              </svg>
            }
          />
          <FeatureCard
            delay={0.1}
            color="#9B6CC9"
            title="Privacidad Total"
            description="Autenticación con Clerk y datos protegidos por cifrado end-to-end. Tu información académica siempre protegida."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path
                  fillRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <FeatureCard
            delay={0.2}
            color="#5C9474"
            title="Gestión de Alumnos"
            description="Panel de control para docentes con listado completo, roles y seguimiento de interacciones en tiempo real."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
              </svg>
            }
          />
          <FeatureCard
            delay={0.3}
            color="#C0784A"
            title="Respuestas Instantáneas"
            description="Velocidad de respuesta ultra-rápida gracias a Groq API. Sin esperas, sin interrupciones en tu flujo de estudio."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path
                  fillRule="evenodd"
                  d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.818a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.845-.143z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <FeatureCard
            delay={0.4}
            color="#5B8ECA"
            title="Historial de Conversación"
            description="Mantén el contexto de tus consultas. La IA recuerda la sesión para darte respuestas coherentes y progresivas."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <FeatureCard
            delay={0.5}
            color="#9B6CC9"
            title="Modo Oscuro / Claro"
            description="Interfaz adaptable a tus preferencias. Diseñada para largas sesiones de estudio sin fatiga visual."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.592-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="landing-footer-cta">
        <div className="landing-footer-glow" />
        <h2 className="landing-footer-title">
          Listo para comenzar tu jornada académica potenciada por IA?
        </h2>
        <SignInButton mode="redirect">
          <button className="landing-btn-primary landing-btn-large" id="landing-signin-btn-footer">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Acceder ahora
          </button>
        </SignInButton>
        <p className="landing-footer-note">
          Requiere cuenta institucional · Acceso gratuito para estudiantes
        </p>
      </section>
    </main>
  );
}
