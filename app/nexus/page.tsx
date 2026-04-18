"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Nexus() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Saludos desde la PR para probar CodeQL!

  // Matrix text rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let drops: number[] = [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 14;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: columns }).fill(1) as number[];
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let lastDrawTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);
      
      const deltaTime = currentTime - lastDrawTime;
      if (deltaTime > interval) {
        lastDrawTime = currentTime - (deltaTime % interval);
        
        ctx.fillStyle = "rgba(2, 5, 19, 0.1)"; // Slight dark fade
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#10b981"; // Emerald color
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = letters[Math.floor(Math.random() * letters.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }
    };

    animationFrameId = requestAnimationFrame(draw);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Fake system logs
  useEffect(() => {
    const fakeEvents = [
      "Breach attempt detected on port 22 (SSH) - IP 192.168.1.104",
      "DDoS mitigation engaged in routing sector 7...",
      "Analyzing suspicious payloads in incoming zero-day...",
      "Firewall rule #491 updated successfully.",
      "Connection from unauthorized subnet dropped.",
      "Decrypting shadow traffic from remote endpoint...",
      "System integrity verified at 99.98%."
    ];
    
    const logInterval = setInterval(() => {
      const newLog = `[${new Date().toISOString().split("T")[1].slice(0,-1)}] ${fakeEvents[Math.floor(Math.random() * fakeEvents.length)]}`;
      setLogs((prev) => [newLog, ...prev].slice(0, 10)); // Keep last 10
    }, 1800);

    return () => clearInterval(logInterval);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#020513] text-emerald-500 font-mono overflow-hidden flex flex-col selection:bg-emerald-500/30">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20 pointer-events-none" />
      
      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:px-6 border-b border-emerald-900/50 bg-[#020513]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-emerald-600 hover:text-emerald-400 transition-colors text-sm font-semibold flex items-center gap-2">
            <span>&larr;</span> <span>VOLVER</span>
          </Link>
          <div className="h-4 w-px bg-emerald-900/80 hidden sm:block"></div>
          <h1 className="text-lg sm:text-xl font-bold tracking-[0.2em] uppercase text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
            NEXUS CMD
          </h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950/40 rounded-full border border-emerald-800/60">
             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
             <span className="text-xs uppercase tracking-widest text-emerald-500 font-bold">ALERTA ACTIVA</span>
           </div>
           <UserButton />
        </div>
      </header>

      {/* Grid Content */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 overflow-y-auto">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Main Stat Card */}
          <div className="group bg-[#06122c]/60 border border-emerald-800/40 p-6 rounded-xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:bg-[#06122c]/80 hover:border-emerald-500/50">
            <h2 className="text-xs text-emerald-600/80 uppercase tracking-widest mb-2 font-semibold">Amenazas Neutralizadas</h2>
            <div className="text-5xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-end gap-3 font-sans">
              8,492 
              <span className="text-emerald-400 text-lg mb-2 animate-bounce flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                <span className="text-sm font-mono">+12%</span>
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-900/30 flex justify-between text-xs text-emerald-600">
              <span>Última 24hs</span>
              <span className="text-emerald-400">Estable</span>
            </div>
          </div>
          
          {/* Sub Stats List */}
          <div className="bg-[#06122c]/60 border border-emerald-800/40 p-6 rounded-xl backdrop-blur-md">
            <h2 className="text-xs text-emerald-600/80 uppercase tracking-widest mb-5 font-semibold">Estado de Red</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-300">MAINFRAME 01</span>
                  <span className="text-white font-sans font-bold">92%</span>
                </div>
                <div className="w-full bg-[#020513] rounded-full h-1.5 border border-emerald-950">
                  <div className="bg-emerald-400 h-1.5 rounded-full shadow-[0_0_8px_#34d399]" style={{ width: "92%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-300">FIREWALL FRONT</span>
                  <span className="text-white font-sans font-bold">100%</span>
                </div>
                <div className="w-full bg-[#020513] rounded-full h-1.5 border border-emerald-950">
                  <div className="bg-emerald-400 h-1.5 rounded-full shadow-[0_0_8px_#34d399]" style={{ width: "100%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-300">CRYPTO NODE X</span>
                  <span className="text-red-400 font-sans font-bold animate-pulse">45%</span>
                </div>
                <div className="w-full bg-[#020513] rounded-full h-1.5 border border-emerald-950">
                  <div className="bg-gradient-to-r from-red-600 to-red-400 h-1.5 rounded-full shadow-[0_0_8px_#f87171]" style={{ width: "45%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Radar Graphics */}
          <div className="flex-1 bg-[#06122c]/40 border border-emerald-800/40 rounded-xl backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[300px] group">
             
             {/* Hologram Rings */}
             <div className="relative w-[280px] sm:w-[360px] aspect-square flex items-center justify-center">
                {/* Rings */}
                <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-emerald-500/20 animate-[spin_40s_linear_infinite]"></div>
                <div className="absolute inset-4 rounded-full border border-emerald-500/10 animate-[spin_25s_linear_infinite_reverse]"></div>
                <div className="absolute inset-12 rounded-full border-2 border-dotted border-emerald-500/30 animate-[spin_15s_linear_infinite]"></div>
                
                {/* Crosshairs */}
                <div className="absolute w-full h-[1px] bg-emerald-500/10"></div>
                <div className="absolute h-full w-[1px] bg-emerald-500/10"></div>
                <div className="absolute w-[70%] h-[70%] border border-emerald-500/20 rounded-full"></div>

                {/* Core */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-emerald-950/80 border border-emerald-400/80 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.3)] backdrop-blur-xl">
                   <div className="text-center">
                     <div className="text-xl font-bold text-white drop-shadow-md tracking-wider">CORE</div>
                     <div className="text-[9px] opacity-70 tracking-widest text-emerald-300">ONLINE</div>
                   </div>
                </div>
                
                {/* Blips & Anomalies */}
                <div className="absolute top-[20%] right-[30%] w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_12px_#ef4444] animate-ping"></div>
                <div className="absolute text-[10px] text-red-400 top-[15%] right-[33%] opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-0.5 rounded border border-red-500/30">Anomalía</div>
                
                <div className="absolute bottom-[25%] left-[20%] w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] animate-pulse"></div>
                <div className="absolute bottom-[18%] left-[25%] w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] animate-pulse delay-700"></div>
             </div>
             
             {/* Tech overlay pattern */}
             <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
          
          {/* Terminal Box */}
          <div className="h-56 bg-black/90 border border-emerald-900/80 p-4 sm:p-5 rounded-xl font-mono text-xs sm:text-sm overflow-hidden flex flex-col shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-600/50 to-transparent"></div>
            
            <div className="text-emerald-600/80 mb-3 border-b border-emerald-950 pb-2 flex justify-between items-center bg-black/50 sticky top-0">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                root@nexus:~/system/logs tail -f security.log
              </span>
              <span className="animate-pulse bg-emerald-500 text-black px-1.5 py-0.5 text-[10px] font-bold tracking-wider">LIVE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent flex flex-col-reverse">
              {logs.map((log, i) => (
                <div key={i} className={`opacity-${Math.max(20, 100 - i * 15)} transition-all duration-300 break-words ${log.includes("detected") || log.includes("unauthorized") ? "text-red-400 drop-shadow-[0_0_2px_rgba(248,113,113,0.8)]" : "text-emerald-400"}`}>
                  <span className="text-emerald-700 font-bold mr-2 select-none">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
