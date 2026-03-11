import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Film, FolderHeart, Pin } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";

const PublicRollCard = ({ roll, username, index, isPinned }: { roll: any, username: string, index: number, isPinned?: boolean }) => (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both relative" style={{ animationDelay: `${index * 150}ms` }}>
        {isPinned && (
            <div className="absolute -top-3 -right-3 sm:-right-4 z-50 bg-[#110e0c] p-2 rounded-full border border-white/10 shadow-xl rotate-12">
                <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
            </div>
        )}
        <Link href={`/u/${username}/${roll.slug || roll.id}`} className="block group">
            <div className={`w-full relative flex items-center bg-[#110e0c] shadow-2xl overflow-hidden rounded-sm ring-1 ring-white/5 hover:scale-[1.01] transition-transform duration-300 p-4 sm:py-[30px] sm:px-[20px] ${isPinned ? 'border-t-2 border-yellow-500/30' : ''}`}>
                {/* Top Edge */}
                <div className="absolute top-0 left-0 right-0 h-[24px] w-full pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <filter id={`card-grain-${roll.id}`}>
                                <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                                <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.25 0" />
                            </filter>
                            <pattern id={`card-holes-top-${roll.id}`} x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
                                <rect x="12" y="5" width="24" height="14" rx="3" fill="black" />
                            </pattern>
                            <mask id={`card-mask-top-${roll.id}`}>
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill={`url(#card-holes-top-${roll.id})`} />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="#110e0c" mask={`url(#card-mask-top-${roll.id})`} />
                        <rect width="100%" height="100%" filter={`url(#card-grain-${roll.id})`} opacity="0.5" mask={`url(#card-mask-top-${roll.id})`} />
                    </svg>
                </div>

                <div className="w-24 h-24 sm:w-32 sm:h-24 shrink-0 bg-black rounded overflow-hidden relative shadow-inner border border-white/10 z-10">
                    {roll.coverImage || roll.photos?.[0]?.url ? (
                        <img src={roll.coverImage || roll.photos[0].url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700 mix-blend-screen hover:scale-105" alt="cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-[8px] sm:text-[10px] text-foreground/20 uppercase tracking-widest text-center px-2 bg-zinc-900/40">
                            Unexposed
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 py-1 sm:py-2 pl-4 sm:pl-6 z-10">
                    <h3 className="font-bold text-lg sm:text-2xl truncate text-foreground group-hover:text-white transition-colors">{roll.title}</h3>
                    <p className="text-xs sm:text-sm font-mono text-foreground/50 mt-1 uppercase tracking-widest">{roll._count.photos} frames exposed</p>
                </div>
                <div className="text-xs font-mono text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 whitespace-nowrap hidden sm:block pr-4 z-10">
                    View Roll →
                </div>

                {/* Bottom Edge */}
                <div className="absolute bottom-0 left-0 right-0 h-[24px] w-full pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <pattern id={`card-holes-bottom-${roll.id}`} x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
                                <rect x="12" y="5" width="24" height="14" rx="3" fill="black" />
                            </pattern>
                            <mask id={`card-mask-bottom-${roll.id}`}>
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill={`url(#card-holes-bottom-${roll.id})`} />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="#110e0c" mask={`url(#card-mask-bottom-${roll.id})`} />
                        <rect width="100%" height="100%" filter={`url(#card-grain-${roll.id})`} opacity="0.5" mask={`url(#card-mask-bottom-${roll.id})`} />
                    </svg>
                </div>
            </div>
        </Link>
    </div>
);

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;

    const user: any = await prisma.user.findUnique({
        where: { username },
        select: {
            username: true,
            bio: true,
            avatar: true,
        },
    });

    if (!user) {
        return {
            title: "User Not Found | RollVault",
        };
    }

    const title = `@${user.username} | RollVault`;
    const description = user.bio || `View ${user.username}'s film photography vault.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            ...(user.avatar && {
                images: [{ url: user.avatar }],
            }),
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(user.avatar && {
                images: [user.avatar],
            }),
        },
    };
}

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    const user: any = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
            archives: {
                where: { showOnProfile: true },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    rolls: {
                        where: { showOnProfile: true, pinOrder: null },
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            slug: true,
                            title: true,
                            coverImage: true,
                            _count: { select: { photos: true } },
                            photos: {
                                take: 1,
                                orderBy: { orderIndex: "asc" },
                                select: { id: true, url: true },
                            },
                        },
                    },
                },
            },
            rolls: {
                where: { archives: { none: {} }, showOnProfile: true, pinOrder: null },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    coverImage: true,
                    _count: { select: { photos: true } },
                    photos: {
                        take: 1,
                        orderBy: { orderIndex: "asc" },
                        select: { id: true, url: true },
                    },
                },
            },
        },
    });

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center text-foreground/50">Photographer not found.</div>;
    }

    // Fetch pinned rolls across both archived and unarchived sets
    const pinnedRolls = await prisma.roll.findMany({
        where: { userId: user.id, showOnProfile: true, pinOrder: { not: null } },
        orderBy: { pinOrder: 'asc' },
        include: {
            _count: { select: { photos: true } },
            photos: { take: 1, orderBy: { orderIndex: "asc" } }
        }
    });

    const hasContent = user.rolls.length > 0 || user.archives.some((a: any) => a.rolls.length > 0) || pinnedRolls.length > 0;

    return (
        <div className="min-h-screen pt-8 pb-16 sm:py-24 px-4 sm:px-6 flex flex-col items-center max-w-2xl mx-auto space-y-12 sm:space-y-16 relative">
            {/* Mobile-Friendly Navigation Header */}
            <div className="w-full flex items-center justify-between z-50 mb-8 sm:absolute sm:top-8 sm:left-8 sm:right-8 sm:mb-0 sm:w-auto sm:justify-start">
                {/* Home/Logo */}
                <Link href="/" className="inline-flex items-center gap-2 font-serif italic text-lg sm:text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
                    <img src="/logo.png" alt="RollVault" className="h-6 sm:h-7 w-auto" />
                </Link>

                {/* Share Dropdown (Mobile Right / Desktop Top-Right Absolute) */}
                <div className="sm:absolute sm:right-0 sm:top-0">
                    <ShareButton title="Share" variant="outline" />
                </div>
            </div>

            <div className="absolute top-0 left-1/2 w-full max-w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 overflow-hidden" />

            <div className="text-center space-y-4 z-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="w-24 h-24 mx-auto bg-card rounded-full flex items-center justify-center border border-border shadow-2xl relative overflow-hidden">
                    {user.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
                    ) : (
                        <Film className="w-8 h-8 text-accent opacity-50" />
                    )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">@{user.username}</h1>
                {user.bio ? (
                    <p className="text-foreground/60 max-w-md mx-auto text-lg">{user.bio}</p>
                ) : (
                    <p className="text-foreground/40 italic font-serif text-lg">Analog photographer</p>
                )}
            </div>

            <div className="w-full space-y-12 z-10">
                {!hasContent ? (
                    <div className="border border-dashed border-border/50 rounded-xl p-16 text-center bg-card/10">
                        <p className="text-foreground/40 font-mono text-sm uppercase tracking-widest">No rolls developed yet</p>
                    </div>
                ) : (
                    <>
                        {/* Pinned Rolls Showcase */}
                        {pinnedRolls.length > 0 && (
                            <div className="space-y-4 border-b border-border/50 pb-8 mb-8">
                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <Pin className="w-4 h-4 text-yellow-500" />
                                    <span className="text-xs font-mono uppercase tracking-widest text-yellow-500/80">Pinned Rolls</span>
                                </div>
                                {pinnedRolls.map((roll: any, i: number) => (
                                    <PublicRollCard key={roll.id} roll={roll} username={user.username} index={i} isPinned />
                                ))}
                            </div>
                        )}

                        {/* Unarchived Rolls */}
                        {user.rolls.length > 0 && (
                            <div className="space-y-4">
                                {user.rolls.map((roll: any, i: number) => (
                                    <PublicRollCard key={roll.id} roll={roll} username={user.username} index={i} />
                                ))}
                            </div>
                        )}

                        {/* Archives */}
                        {user.archives.map((archive: any) => {
                            if (archive.rolls.length === 0) return null;
                            return (
                                <div key={archive.id} className="space-y-4 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                    <div className="flex items-center gap-3 px-2 border-b border-border/50 pb-4 mb-6">
                                        <FolderHeart className="w-6 h-6 text-accent" />
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">{archive.title}</h2>
                                            {archive.description && <p className="text-sm text-foreground/60 font-mono mt-1">{archive.description}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-4 pl-4 sm:pl-8 border-l border-border/50">
                                        {archive.rolls.map((roll: any, i: number) => (
                                            <PublicRollCard key={roll.id} roll={roll} username={user.username} index={i} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            <div className="pt-16 pb-8 text-center z-10 opacity-50 hover:opacity-100 transition-opacity">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-serif italic tracking-wide text-foreground/50 hover:text-foreground transition-colors">
                    Powered by RollVault
                </Link>
            </div>
        </div>
    );
}
