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
      await stat(join(process.cwd(), "public", "demo", `${frame}.jpg`));
      return true;
    } catch {
      return false;
    }
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
          <Film className="w-5 h-5 text-accent" />
          <span>RollVault</span>
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <Button size="sm" variant="safelight">Dashboard</Button>
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

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Your film, <br />
            <span className="text-foreground opacity-50 italic font-serif">beautifully displayed.</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/60 max-w-xl mx-auto text-balance">
            RollVault is the minimalist home for analog photographers.
            Host your developed rolls, organize them elegantly, and share your visual vault.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full px-4 sm:px-0">
            {session ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
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

        {/* Abstract Film Roll Visual */}
        <div className="mt-24 w-full max-w-5xl translate-x-4 md:translate-x-12 opacity-80 opacity-transition hover:opacity-100 duration-1000 group">
          <div className="flex gap-4 p-4 border-y-8 border-black bg-[#0a0a0a] shadow-2xl relative overflow-hidden mix-blend-screen">
            {/* Sprocket holes top */}
            <div className="absolute top-0 inset-x-0 h-4 flex justify-around items-center">
              {[...Array(30)].map((_, i) => (
                <div key={`top-${i}`} className="w-3 h-2 bg-background rounded-[1px] opacity-20" />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((frame, index) => {
              const fileExists = demoFiles[index];
              return (
                <div
                  key={frame}
                  className="w-64 h-40 bg-card rounded flex flex-col items-center justify-center border border-border/10 overflow-hidden relative shrink-0 group-hover:-translate-x-8 transition-transform duration-1000 ease-out"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black to-zinc-800 z-0" />
                  {/* Fallback text if image hasn't been added yet */}
                  {!fileExists && (
                    <div className="relative z-10 flex flex-col items-center text-center opacity-30 mt-2">
                      <span className="font-mono text-xs text-foreground">Frame {frame}</span>
                    </div>
                  )}

                  {/* The actual image. We hide it on error if the user hasn't dropped the file into the demo folder yet. */}
                  {fileExists && (
                    <img
                      src={`/demo/${frame}.jpg`}
                      alt={`Demo Frame ${frame}`}
                      className="absolute inset-0 w-full h-full object-cover z-20 opacity-90 mix-blend-screen"
                    />
                  )}
                </div>
              )
            })}
            {/* Sprocket holes bottom */}
            <div className="absolute bottom-0 inset-x-0 h-4 flex justify-around items-center">
              {[...Array(30)].map((_, i) => (
                <div key={`bot-${i}`} className="w-3 h-2 bg-background rounded-[1px] opacity-20" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
