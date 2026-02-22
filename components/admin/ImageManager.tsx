"use client";

import { useState, useCallback } from "react";

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageManager({ images, onChange }: ImageManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        // In production, upload to Cloud Storage via API
        // For now, create local preview URL
        const url = URL.createObjectURL(file);
        newImages.push(url);
      }

      onChange([...images, ...newImages]);
    } finally {
      setUploading(false);
    }
  }, [images, onChange]);

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={`${img}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square rounded-xl border-2 ${
                dragIndex === index
                  ? "border-coral border-dashed opacity-50"
                  : "border-gray-200"
              } overflow-hidden cursor-grab active:cursor-grabbing`}
            >
              {/* Placeholder since we use object URLs or real URLs */}
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-3xl">🖼️</span>
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors"
                >
                  🗑️
                </button>
              </div>

              {/* Main image badge */}
              {index === 0 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-coral text-white text-xs rounded-full font-medium">
                  ראשית
                </span>
              )}

              {/* Drag handle */}
              <span className="absolute bottom-2 right-2 text-white/80 text-xs">
                ⋮⋮
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <label className="block">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-coral/50 hover:bg-coral/5 transition-all cursor-pointer">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">מעלה תמונות...</p>
            </div>
          ) : (
            <>
              <span className="text-3xl block mb-2">📤</span>
              <p className="text-sm font-medium text-charcoal">
                גרור תמונות לכאן או לחץ להעלאה
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP — עד 5MB לתמונה
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </label>

      {/* Tips */}
      <p className="text-xs text-gray-400">
        💡 גרור תמונות לשינוי סדר. התמונה הראשונה תוצג כתמונה ראשית.
      </p>
    </div>
  );
}
