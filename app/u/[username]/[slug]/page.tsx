import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string, slug: string }> }): Promise<Metadata> {
    const { username, slug } = await params;

    const roll: any = await prisma.roll.findFirst({
        where: {
            // @ts-ignore
            OR: [
                { slug: slug },
                { id: slug }
            ]
        },
        include: {
            user: true,
            photos: { take: 1, orderBy: { orderIndex: "asc" } }
        }
    });

    if (!roll || roll.user.username !== username) {
        return {
            title: "Roll Not Found | RollVault",
        };
    }

    const title = `${roll.title} | ${username}`;
    const description = roll.description || `View ${roll.title} by @${username} on RollVault.`;
    const image = roll.coverImage || roll.photos?.[0]?.url;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            ...(image && {
                images: [{ url: image }],
            }),
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(image && {
                images: [image],
            }),
        },
    };
}

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
        <>
            {/* Lock scroll at document level — overflow-hidden on a div alone can't stop iOS Safari */}
            <style>{`html, body { overflow: hidden !important; overscroll-behavior: none !important; height: 100% !important; }`}</style>
            <div className="h-[100dvh] bg-[#060606] flex flex-col overflow-hidden">
                {/* Header / Nav */}
                <header className="sticky top-0 z-50 w-full px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-white/5 bg-[#060606]/95 backdrop-blur-md">
                    {/* Left: Back Button */}
                    <Link
                        href={`/u/${username}`}
                        className="flex items-center gap-2 text-sm font-mono text-white opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">@{username.toUpperCase()}</span>
                    </Link>

                    {/* Center: Absolute Logo (forced dead center regardless of flex siblings) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <img src="/logo.png" alt="RollVault Logo" className="h-4 sm:h-5 object-contain opacity-70" />
                    </div>

                    {/* Right: Share Button */}
                    <div className="flex items-center gap-6">
                        <ShareButton title="Share" variant="ghost" className="text-white/50 hover:text-white" />
                    </div>
                </header>

                {/* Content area — pushed toward top third of screen */}
                <div className="flex-1 flex flex-col justify-start pt-8">
                    {/* Intro info */}
                    <div className="max-w-3xl mx-auto px-6 pt-6 pb-4 text-center shrink-0">
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white/90 mb-4">{roll.title}</h1>
                        {roll.description && (
                            <p className="text-lg text-white/60 italic font-serif">{roll.description}</p>
                        )}
                        <p className="text-white/30 font-mono text-xs uppercase tracking-widest mt-6">
                            {roll.photos.length} frames exposed
                        </p>
                    </div>

                    {/* Clean snapping gallery */}
                    <main className="w-full flex flex-col items-center justify-start pb-4 overflow-hidden">
                        <div className="w-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="flex flex-nowrap w-max gap-4 sm:gap-12 py-4 items-start">
                                {/* Start spacer — 14vw on mobile gives adjacent frame a good peek */}
                                <div className="w-[14vw] sm:w-[18vw] shrink-0" />

                                {roll.photos.map((photo: any, i: number) => (
                                    <div
                                        key={photo.id}
                                        className="shrink-0 flex flex-col items-start snap-center group/frame"
                                    >
                                        {/* Top Label — no w-full, naturally sized to match image */}
                                        <div className="flex justify-start mb-3">
                                            <span className="text-[10px] sm:text-xs text-white/40 font-mono tracking-widest pl-1">
                                                FRAME {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>

                                        {/* Photo Container — inline-flex shrink-wraps tightly to the image */}
                                        <div className="relative rounded-sm border border-white/5 shadow-2xl overflow-hidden transition-transform duration-700 group-hover/frame:scale-[1.01] inline-flex">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || `Frame ${i + 1}`}
                                                className="block opacity-90 transition-opacity duration-1000 group-hover/frame:opacity-100"
                                                style={{
                                                    width: 'auto',
                                                    height: 'auto',
                                                    maxWidth: '50vw',
                                                    maxHeight: '35vh',
                                                }}
                                            />
                                        </div>

                                        {/* Elegant Caption underneath */}
                                        {photo.caption ? (
                                            <div className="text-center px-2 mt-4" style={{ maxWidth: '50vw' }}>
                                                <p className="text-xs sm:text-sm font-serif italic text-white/50 tracking-wide">{photo.caption}</p>
                                            </div>
                                        ) : (
                                            <div className="h-4 w-full mt-4" />
                                        )}
                                    </div>
                                ))}

                                {/* End spacer — mirrors start */}
                                <div className="w-[14vw] sm:w-[18vw] shrink-0" />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
