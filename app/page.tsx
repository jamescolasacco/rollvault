import Link from "next/link";
import { Button } from "@/components/Button";
import { Camera, Film } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stat } from "fs/promises";
import { join } from "path";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Check which demo files exist to prevent next.js SSR errors
  const demoFiles = await Promise.all([1, 2, 3, 4, 5].map(async (frame) => {
    try {
      await stat(join(process.cwd(), "public", "demo", `${frame}.webp`));
      return true;
    } catch {
      return false;
    }
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
          <img src="/logo.png" alt="RollVault" className="h-6 sm:h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <Link href="/vault">
              <Button size="sm" variant="safelight">Your Vault</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm" variant="safelight">Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl text-center space-y-8 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs font-mono text-foreground/60 mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Now in public beta
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight px-2 sm:px-0 leading-[1.2]">
            Your film, <br />
            <span className="text-foreground italic font-serif inline-block pr-6" style={{ filter: 'opacity(50%)' }}>beautifully displayed.</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/60 max-w-xl mx-auto text-balance px-2 sm:px-0">
            RollVault is the home for your analog photography.
            <br />
            Upload your developed rolls, organize them, and share your visual vault.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full px-4 sm:px-0">
            {session ? (
              <Link href="/vault" className="w-full sm:w-auto">
                <Button size="lg" variant="safelight" className="gap-2 w-full sm:w-auto">
                  Visit your vault
                  <Film className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="safelight" className="gap-2 w-full sm:w-auto">
                  Start your vault
                  <Film className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Simplified Film Strip (No Sprockets) */}
        <div className="mt-12 sm:mt-16 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="relative overflow-hidden">
            {/* Scroll Viewport */}
            <div className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex flex-nowrap w-max gap-3 sm:gap-6 px-4 sm:px-8 py-4 sm:py-8 items-center">
                {[1, 2, 3, 4, 5].map((frame, index) => {
                  const fileExists = demoFiles[index];
                  return (
                    <div
                      key={frame}
                      style={{ flex: "0 0 auto" }}
                      className="w-56 sm:w-96 h-40 sm:h-64 bg-[#0a0a0a] rounded-sm ring-1 ring-white/5 overflow-hidden relative snap-center shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:ring-white/10 group/frame"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] to-zinc-900/40 z-0 pointer-events-none" />

                      {/* Frame Label */}
                      <div className="absolute top-3 left-3 z-30 opacity-40">
                        <span className="font-mono text-[8px] sm:text-[10px] text-white tracking-[0.2em]">FRAME {String(frame).padStart(2, '0')}</span>
                      </div>

                      {/* Fallback if no image */}
                      {!fileExists && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                          <Camera className="w-12 h-12" />
                        </div>
                      )}

                      {/* The actual image */}
                      {fileExists && (
                        <img
                          src={`/demo/${frame}.webp`}
                          alt={`Demo Frame ${frame}`}
                          className="absolute inset-0 w-full h-full object-cover z-20 opacity-80 group-hover/frame:opacity-100 transition duration-700 mix-blend-screen scale-[1.01]"
                        />
                      )}

                      {/* Subtle Inner Shadow */}
                      <div className="absolute inset-0 shadow-[inner_0_0_40px_rgba(0,0,0,0.8)] z-30 pointer-events-none" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Edge Labels */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[10px] sm:text-xs text-yellow-600/20 mix-blend-overlay rotate-90 pointer-events-none tracking-[1em] z-30 uppercase">
              RollVault Safelight
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
