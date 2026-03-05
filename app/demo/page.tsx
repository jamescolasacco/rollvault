import Link from "next/link";
import { ArrowLeft, Film, FolderHeart } from "lucide-react";
import { Button } from "@/components/Button";

export default function DemoPage() {
    // Simulated demo data to showcase the app without a backend request
    const mockRolls = [
        { id: "1", title: "Summer in Kyoto", description: "Fuji Superia 400. Shot on Canon AE-1.", photosCount: 24, coverUrl: "/demo/1.jpg" },
        { id: "2", title: "Pacific Coast", description: "Portra 400. Beaches and beyond.", photosCount: 16, coverUrl: "/demo/2.jpg" },
        { id: "3", title: "Outer Landscapes", description: "Ilford HP5 Plus. Natural lighting tests.", photosCount: 36, coverUrl: "/demo/3.jpg" },
        { id: "4", title: "London Streets", description: "Cinestill 800T through the streets.", photosCount: 12, coverUrl: "/demo/4.jpg" },
        { id: "5", title: "Trip to Portugal", description: "Ektar 100. Beautiful landmarks.", photosCount: 36, coverUrl: "/demo/5.jpg" },
        { id: "6", title: "Autumn Leaves", description: "ColorPlus 200. Park walk.", photosCount: 24, coverUrl: "/demo/1.jpg" },
        { id: "7", title: "Cafe Hopping", description: "Gold 200. Coffee and friends.", photosCount: 36, coverUrl: "/demo/2.jpg" },
    ];

    const mockArchives = [
        { id: "a1", title: "Travel 2025", desc: "All the film shot during 2025's travels.", rolls: 3 },
        { id: "a2", title: "Travel 2026", desc: "All the film shot during 2026's travels.", rolls: 2 },
        { id: "a3", title: "Portraits", desc: "Various portrait sessions.", rolls: 5 },
        { id: "a4", title: "Street Photography", desc: "Urban scenes.", rolls: 12 },
        { id: "a5", title: "Family", desc: "Family gatherings and holidays.", rolls: 8 },
        { id: "a6", title: "Experiments", desc: "Expired film and light leaks.", rolls: 4 },
        { id: "a7", title: "Landscapes", desc: "Nature walks.", rolls: 6 },
    ];

    const displayRolls = mockRolls.slice(0, 6);
    const displayArchives = mockArchives.slice(0, 6);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

            {/* Header */}
            <nav className="px-6 h-16 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-foreground/50 hover:text-foreground inline-flex items-center gap-2 transition-colors text-sm font-mono uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 shrink-0" /> Home
                    </Link>
                </div>
                <div className="flex items-center gap-2 font-serif italic text-base sm:text-lg tracking-wide text-foreground/80">
                    <Film className="w-5 h-5 text-accent opacity-50" />
                    Interactive Demo
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/register">
                        <Button size="sm" variant="safelight">Start <span className="hidden sm:inline">&nbsp;for free</span></Button>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-16 relative z-10">

                {/* Intro Section */}
                <div className="max-w-2xl text-balance">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Experience the vault.</h1>
                    <p className="text-lg text-foreground/60">
                        This is a simulated view of what your RollVault dashboard looks like once you begin uploading developed rolls and categorizing them into archives.
                    </p>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-accent/30 transition-colors">
                        <div className="text-3xl font-bold text-accent mb-1 group-hover:scale-110 transition-transform origin-left w-max">5</div>
                        <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Total Rolls</div>
                    </div>
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-white/30 transition-colors">
                        <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform origin-left w-max">124</div>
                        <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Total Frames</div>
                    </div>
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-white/30 transition-colors">
                        <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform origin-left w-max">2</div>
                        <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Archives</div>
                    </div>
                </div>

                {/* Simulated Recent Rolls */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <h2 className="text-2xl font-bold tracking-tight">Recent Rolls</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayRolls.map((roll, i) => (
                            <div key={roll.id} className="block group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="relative bg-card rounded-xl border border-border/50 p-4 shadow-sm hover:shadow-xl hover:border-white/20 transition-all flex items-center gap-5 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="w-20 h-20 shrink-0 bg-black rounded-lg overflow-hidden relative border border-white/5 z-10">
                                        <img src={roll.coverUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-500 mix-blend-screen scale-105" alt="cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 z-10 leading-tight">
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-white transition-colors truncate">{roll.title}</h3>
                                        <p className="text-xs font-mono text-foreground/40 mt-1 uppercase tracking-widest">{roll.photosCount} frames</p>
                                        <p className="text-sm mt-1.5 text-foreground/50 italic line-clamp-1">{roll.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {mockRolls.length > 6 && (
                        <div className="mt-8 flex justify-center animate-in fade-in duration-700">
                            <Button variant="outline" className="cursor-default opacity-80 pointer-events-none">
                                Show all rolls ({mockRolls.length})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Simulated Archives */}
                <div className="space-y-6 pt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-accent pl-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-1">Your Archives</h2>
                            <p className="text-sm text-foreground/60">Organize your collections into subfolders.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayArchives.map((archive, i) => (
                            <div key={archive.id} className="block group cursor-pointer animate-in fade-in duration-1000" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="relative bg-card border border-border/50 p-6 shadow-md hover:border-accent/40 transition-colors flex flex-col justify-between rounded-xl overflow-hidden" style={{ minHeight: '160px' }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FolderHeart className="w-5 h-5 text-accent opacity-50 group-hover:scale-110 transition-transform" />
                                            <h3 className="font-bold text-xl tracking-tight text-foreground truncate group-hover:text-white transition-colors">{archive.title}</h3>
                                        </div>
                                        <p className="text-foreground/60 text-sm line-clamp-2">{archive.desc}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-foreground/50 uppercase tracking-widest z-10">
                                        <span>{archive.rolls} Rolls</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {mockArchives.length > 6 && (
                        <div className="mt-8 flex justify-center animate-in fade-in duration-700">
                            <Button variant="outline" className="cursor-default opacity-80 pointer-events-none">
                                Show all archives ({mockArchives.length})
                            </Button>
                        </div>
                    )}
                </div>

                <div className="pt-24 pb-16 text-center text-sm text-foreground/40 space-y-4 relative z-10">
                    <p className="uppercase tracking-widest font-mono text-xs">This is a non-functional interactive demonstration.</p>
                    <div>
                        <Link href="/register" className="inline-block text-accent hover:text-white hover:underline transition-colors text-lg italic font-serif">Start your vault today →</Link>
                    </div>
                </div>
            </div>
            {/* Ambient Background Base Filter */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-soft-light pointer-events-none" />
        </div>
    );
}
