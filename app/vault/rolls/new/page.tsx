import { createRoll } from "@/app/actions/roll";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";

export default function NewRollPage() {
    return (
        <div className="max-w-xl mx-auto mt-8 space-y-8">
            <div>
                <Link href="/vault" className="text-foreground/50 hover:text-foreground inline-flex items-center gap-2 mb-6 transition-colors text-sm font-mono uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Vault
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Film className="w-5 h-5 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Load a new roll</h1>
                </div>
                <p className="text-foreground/60">Give it a title and description before developing your photos.</p>
            </div>

            <form action={createRoll} className="space-y-6 bg-card/10 p-6 rounded-xl border border-border/80 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                {/* Abstract decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

                <div className="space-y-2 relative z-10">
                    <label className="text-xs font-mono uppercase tracking-widest text-foreground/60 ml-1">Roll Title</label>
                    <Input name="title" required placeholder="e.g. Summer in Tokyo '23" autoFocus />
                </div>
                <div className="space-y-2 relative z-10">
                    <label className="text-xs font-mono uppercase tracking-widest text-foreground/60 ml-1">Description (Optional)</label>
                    <textarea
                        name="description"
                        rows={4}
                        className="flex w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors focus:border-accent/50"
                        placeholder="Kodak Portra 400 pushed +1..."
                    />
                </div>
                <div className="pt-4 relative z-10">
                    <Button type="submit" variant="safelight" className="w-full text-lg h-12">
                        Load Roll
                    </Button>
                </div>
            </form>
        </div>
    );
}
