"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  initials: string;
  className?: string;
}

/** Foto profil (Google) dengan fallback inisial — juga saat URL foto gagal dimuat. */
export function Avatar({ src, initials, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold",
        className
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar Google: host eksternal, tanpa config next/image
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
