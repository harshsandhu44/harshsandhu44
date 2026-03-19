"use client";

import Image from "next/image";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface AboutImageProps {
  mobile: string;
  desktop: string;
}

export function AboutImage({ mobile, desktop }: AboutImageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Image
      src={isMobile ? mobile : desktop}
      alt="Harsh Sandhu"
      fill
      priority
      className="object-cover object-center"
      sizes="100vw"
    />
  );
}

AboutImage.displayName = "AboutImage";
