import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import { FilmStripContainer } from "@/components/FilmStripContainer";
import { ShareButton } from "@/components/ShareButton";

export default async function PublicRollView({ params }: { params: Promise<{ username: string, slug: string }> }) {
    const { username, slug } = await params;

    const roll: any = await prisma.roll.findFirst({
        // @ts-ignore
        where: {
            OR: [
                { slug: slug },
                { id: slug }
            ]
        },
        include: {
            user: true,
            photos: { orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] }
        }
    });

    if (!roll || roll.user.username !== username) {
        return <div className="min-h-screen flex items-center justify-center text-foreground/50 font-mono text-sm uppercase">Roll not found.</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#050505]">
            {/* Header */}
            <header className="px-6 h-16 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/60 backdrop-blur-md z-40">
                <div className="flex-1">
                    <Link href={`/u/${username}`} className="text-white/50 hover:text-white inline-flex items-center gap-2 transition-colors text-sm font-mono uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 shrink-0" /> @{username}
                    </Link>
                </div>
                <div className="flex-1 text-center font-semibold text-white/90 tracking-tight truncate hidden sm:block">
                    {roll.title}
                </div>
                <div className="flex-1 flex justify-end items-center gap-6">
                    <ShareButton title="Share" variant="ghost" className="text-white/50 hover:text-white" />
                    <Link href="/" className="inline-flex items-center gap-2 font-serif italic text-lg tracking-wide text-white/50 hover:text-white transition-colors">
                        <img src="/logo.png" alt="RollVault" className="h-5 sm:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    </Link>
                </div>
            </header>

            {/* Intro info */}
            <div className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center shrink-0">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white/90 mb-4">{roll.title}</h1>
                {roll.description && (
                    <p className="text-lg text-white/60 italic font-serif">{roll.description}</p>
                )}
                <p className="text-white/30 font-mono text-xs uppercase tracking-widest mt-6">
                    {roll.photos.length} frames exposed
                </p>
            </div>

            {/* The Film Strip */}
            <main className="flex-1 w-full max-w-none overflow-x-auto scrollbar-hide flex items-center py-20 lg:py-32">
                <div className="min-w-max px-6 sm:px-12 flex items-center pb-24">
                    <FilmStripContainer>
                        {roll.photos.map((photo: any, i: number) => (
                            <div key={photo.id} className="relative shrink-0 flex flex-col items-center">
                                <div className="relative h-[50vh] lg:h-[65vh] max-w-[85vw] bg-black/20 group overflow-hidden flex items-center justify-center">
                                    <img
                                        src={photo.url}
                                        alt={photo.caption || `Frame ${i + 1}`}
                                        className="h-full w-auto object-contain mix-blend-normal opacity-90 transition-opacity duration-1000 group-hover:opacity-100"
                                    />
                                    {/* Frame number text in margin */}
                                    <div className="absolute top-2 right-3 text-[10px] lg:text-xs text-[#ff8000] font-mono opacity-30 font-bold mix-blend-screen pointer-events-none">
                                        {i + 1}
                                    </div>
                                </div>

                                {/* Caption rendering fixed below the entire photorealistic strip */}
                                {photo.caption && (
                                    <div className="absolute top-full mt-16 sm:mt-20 w-full text-center px-4">
                                        <p className="text-sm font-mono text-white/50">{photo.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </FilmStripContainer>
                </div>
            </main>
        </div>
    );
}
