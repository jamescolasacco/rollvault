"use client";

import React from "react";

interface FilmStripCardProps {
    coverUrl?: string | null;
    title: string;
    frameCount: number;
}

export function FilmStripCard({ coverUrl, title, frameCount }: FilmStripCardProps) {
    return (
        <div className="group flex flex-col items-center w-full transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
            {/* The Film Snippet */}
            <div className="w-full relative flex flex-col bg-[#110e0c] shadow-2xl overflow-hidden rounded-sm ring-1 ring-white/5 py-3 sm:py-5">

                {/* Top Edge */}
                <div className="absolute top-0 left-0 right-0 h-[20px] w-full pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <filter id="card-grain">
                                <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                                <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.25 0" />
                            </filter>
                            <pattern id="card-holes-top" x="0" y="0" width="44" height="20" patternUnits="userSpaceOnUse">
                                <rect x="11" y="3" width="22" height="14" rx="2" fill="black" />
                            </pattern>
                            <mask id="card-mask-top">
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill="url(#card-holes-top)" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="#110e0c" mask="url(#card-mask-top)" />
                        <rect width="100%" height="100%" filter="url(#card-grain)" opacity="0.5" mask="url(#card-mask-top)" />
                    </svg>
                </div>

                {/* The Photo Cutout */}
                <div className="w-full px-2 sm:px-3 relative z-10">
                    <div className="aspect-video w-full bg-black shadow-inner border border-white/10 overflow-hidden relative group-hover:border-white/20 transition-colors">
                        {coverUrl ? (
                            <img src={coverUrl} className="w-full h-full object-cover opacity-80 mix-blend-screen group-hover:opacity-100 transition-all duration-700" alt={title} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40">
                                <span className="font-mono text-[10px] text-foreground/30 uppercase tracking-widest">Unexposed</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-50" />
                    </div>
                </div>

                {/* Bottom Edge */}
                <div className="absolute bottom-0 left-0 right-0 h-[20px] w-full pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <pattern id="card-holes-bottom" x="0" y="0" width="44" height="20" patternUnits="userSpaceOnUse">
                                <rect x="11" y="3" width="22" height="14" rx="2" fill="black" />
                            </pattern>
                            <mask id="card-mask-bottom">
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill="url(#card-holes-bottom)" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="#110e0c" mask="url(#card-mask-bottom)" />
                        <rect width="100%" height="100%" filter="url(#card-grain)" opacity="0.5" mask="url(#card-mask-bottom)" />
                    </svg>
                </div>
            </div>

            {/* Title / Description */}
            <div className="w-full mt-3 px-1">
                <h3 className="font-bold text-lg max-w-full truncate text-foreground group-hover:text-white transition-colors">{title}</h3>
                <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs font-mono text-foreground/50 uppercase tracking-widest">{frameCount} frames</p>
                    <span className="text-xs font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                </div>
            </div>
        </div>
    );
}
