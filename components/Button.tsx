import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility to merge tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "safelight";
    size?: "sm" | "default" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-foreground text-background hover:bg-foreground/90":
                            variant === "default",
                        "border border-border bg-transparent hover:bg-card hover:text-foreground":
                            variant === "outline",
                        "hover:bg-card hover:text-foreground": variant === "ghost",
                        "bg-accent text-white hover:bg-accent/90 shadow-[0_0_15px_rgba(220,38,38,0.5)]":
                            variant === "safelight", // darkroom red glow
                        "h-9 px-3": size === "sm",
                        "h-10 px-4 py-2": size === "default",
                        "h-12 rounded-md px-8 text-base": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
