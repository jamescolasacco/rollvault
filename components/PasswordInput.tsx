"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "./Input";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={`pr-10 ${className || ""}`}
                    ref={ref}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";
