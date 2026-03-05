"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

interface UploadDropzoneProps {
    rollId: string;
    onUploadStart?: (fileCount: number) => void;
    onUploadSuccess?: (photos: any[]) => void;
}

export default function UploadDropzone({ rollId, onUploadStart, onUploadSuccess }: UploadDropzoneProps) {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);
        if (onUploadStart) onUploadStart(files.length);

        const formData = new FormData();
        formData.append("rollId", rollId);
        files.forEach((file) => formData.append("files", file));

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Batch upload failed");

            const data = await res.json();
            if (onUploadSuccess) onUploadSuccess(data.photos);
            else router.refresh(); // Fallback
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const validFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
            uploadFiles(validFiles);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const validFiles = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
            uploadFiles(validFiles);
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
          ${isDragging ? 'border-accent bg-accent/5' : 'border-border/60 hover:border-foreground/30 hover:bg-card/30'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                        <h3 className="font-medium text-foreground">Developing frames...</h3>
                        <p className="text-sm text-foreground/50 mt-1">This might take a moment.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="font-semibold text-foreground text-lg mb-1">Upload multiple frames</h3>
                        <p className="text-sm text-foreground/50">Drag and drop photos here, or click to browse files.</p>
                    </div>
                )}
            </div>
            {error && <p className="text-accent text-sm mt-3">{error}</p>}
        </div>
    );
}
