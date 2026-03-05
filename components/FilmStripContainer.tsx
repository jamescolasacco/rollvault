"use client";

import React from "react";

export function FilmStripContainer({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`relative flex items-center justify-start min-w-max py-12 ${className}`}>
            {/* Light table glow behind the film to make the transparent sprockets visible */}
            <div className="absolute inset-y-16 inset-x-8 bg-[#e8e8e8] shadow-[0_0_120px_rgba(255,255,255,0.2)] rounded-lg opacity-80" />

            {/* Film Base Container */}
            <div
                className="relative z-10 flex flex-col justify-center bg-[#110e0c] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                style={{ borderTop: "40px solid transparent", borderBottom: "40px solid transparent" }}
            >

                {/* Top Edge */}
                <div className="absolute top-[-40px] left-0 right-0 h-[40px] w-full overflow-hidden pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <filter id="film-grain">
                                <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                                <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.2 0" />
                            </filter>
                            <pattern id="sprocket-holes-top" x="0" y="0" width="64" height="40" patternUnits="userSpaceOnUse">
                                {/* Real 35mm sprocket holes are rounded rects */}
                                <rect x="22" y="6" width="20" height="24" rx="4" fill="black" />
                            </pattern>
                            <mask id="film-mask-top">
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill="url(#sprocket-holes-top)" />
                            </mask>
                        </defs>
                        {/* The film base color */}
                        <rect width="100%" height="100%" fill="#110e0c" mask="url(#film-mask-top)" />
                        {/* Overlay grain */}
                        <rect width="100%" height="100%" filter="url(#film-grain)" opacity="0.6" mask="url(#film-mask-top)" />

                        {/* Inner shadows on holes for depth using a stroke */}
                        <pattern id="sprocket-shadows-top" x="0" y="0" width="64" height="40" patternUnits="userSpaceOnUse">
                            <rect x="21" y="5" width="22" height="26" rx="5" fill="none" stroke="black" strokeWidth="2" opacity="0.8" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#sprocket-shadows-top)" mask="url(#film-mask-top)" />
                    </svg>
                </div>

                {/* Content (Photos) */}
                <div className="flex items-center gap-1 sm:gap-2 px-12 relative z-10">
                    {children}
                </div>

                {/* Bottom Edge */}
                <div className="absolute bottom-[-40px] left-0 right-0 h-[40px] w-full overflow-hidden pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <pattern id="sprocket-holes-bottom" x="0" y="0" width="64" height="40" patternUnits="userSpaceOnUse">
                                <rect x="22" y="10" width="20" height="24" rx="4" fill="black" />
                            </pattern>
                            <mask id="film-mask-bottom">
                                <rect width="100%" height="100%" fill="white" />
                                <rect width="100%" height="100%" fill="url(#sprocket-holes-bottom)" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="#110e0c" mask="url(#film-mask-bottom)" />
                        <rect width="100%" height="100%" filter="url(#film-grain)" opacity="0.6" mask="url(#film-mask-bottom)" />

                        <pattern id="sprocket-shadows-bottom" x="0" y="0" width="64" height="40" patternUnits="userSpaceOnUse">
                            <rect x="21" y="9" width="22" height="26" rx="5" fill="none" stroke="black" strokeWidth="2" opacity="0.8" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#sprocket-shadows-bottom)" mask="url(#film-mask-bottom)" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
