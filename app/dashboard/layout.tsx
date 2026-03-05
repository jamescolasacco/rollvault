import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Film } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="px-6 h-16 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
                        <Film className="w-5 h-5 text-accent" />
                        <span>RollVault</span>
                    </Link>
                    <div className="h-4 w-px bg-border/50 hidden sm:block" />
                    <Link href="/dashboard" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors hidden sm:block">
                        Dashboard
                    </Link>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/profile" className="text-sm text-foreground/60 hover:text-foreground font-mono uppercase tracking-wider transition-colors">
                        {session.user?.name}
                    </Link>
                    <LogoutButton />
                </div>
            </header>
            <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
