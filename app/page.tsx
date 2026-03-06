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
          <Film className="w-5 h-5 text-accent" />
          <span>RollVault</span>
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <Link href="/vault">
              <Button size="sm" variant="safelight">Vault</Button>
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
            RollVault is the minimalist home for analog photographers.
            Host your developed rolls, organize them elegantly, and share your visual vault.
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

        {/* Abstract Film Roll Visual */}
        <div className="mt-16 sm:mt-24 w-full max-w-5xl opacity-90 transition-opacity hover:opacity-100 duration-1000 group">
          <div className="relative h-fit border-y-[4px] sm:border-y-8 border-black bg-[#0a0a0a] shadow-2xl overflow-hidden mix-blend-screen flex flex-col justify-center">
            {/* Sprocket holes top */}
            <div className="absolute top-0 inset-x-0 h-4 sm:h-8 flex justify-around items-center opacity-20 pointer-events-none z-0">
              {[...Array(30)].map((_, i) => (
                <div key={`top-${i}`} className="w-1.5 sm:w-3 h-1 sm:h-2 bg-background rounded-[1px]" />
              ))}
            </div>

            {/* Scroll Viewport */}
            <div className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Flex Track enforcing literal width */}
              <div className="flex flex-nowrap w-max gap-3 sm:gap-6 px-4 sm:px-8 py-6 sm:py-12 items-center">
                {[1, 2, 3, 4, 5].map((frame, index) => {
                  const fileExists = demoFiles[index];
                  return (
                    <div
                      key={frame}
                      style={{ flex: "0 0 auto", minWidth: "12rem" }}
                      className="w-48 sm:w-72 sm:min-w-[18rem] h-32 sm:h-48 bg-card rounded flex flex-col items-center justify-center border border-border/10 overflow-hidden relative snap-center shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black to-zinc-800 z-0" />
                      {/* Fallback text if image hasn't been added yet */}
                      {!fileExists && (
                        <div className="relative z-10 flex flex-col items-center text-center opacity-30 mt-2 pointer-events-none">
                          <span className="font-mono text-xs text-foreground">Frame {frame}</span>
                        </div>
                      )}

                      {/* The actual image */}
                      {fileExists && (
                        <img
                          src={`/demo/${frame}.webp`}
                          alt={`Demo Frame ${frame}`}
                          className="absolute inset-0 w-full h-full object-cover z-20 opacity-90 mix-blend-screen pointer-events-none"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sprocket holes bottom */}
            <div className="absolute bottom-0 inset-x-0 h-4 sm:h-8 flex justify-around items-center opacity-20 pointer-events-none z-0">
              {[...Array(30)].map((_, i) => (
                <div key={`bot-${i}`} className="w-1.5 sm:w-3 h-1 sm:h-2 bg-background rounded-[1px]" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
