"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

interface DeleteArchiveButtonProps {
    id: string;
}

export function DeleteArchiveButton({ id }: DeleteArchiveButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this Archive? The Rolls inside will NOT be deleted from your vault.")) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/archives/${id}`, { method: "DELETE" });
            router.push("/dashboard");
            router.refresh();
        } catch (e) {
            console.error(e);
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-400 border-red-900/50 hover:border-red-500/50 ml-auto whitespace-nowrap self-start sm:self-auto"
        >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Archive"}
        </Button>
    );
}
