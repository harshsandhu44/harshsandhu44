import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getColSpanClass(span: number) {
  switch (span) {
    case 2:
      return "md:col-span-2 lg:col-span-2";
    case 3:
      return "md:col-span-2 lg:col-span-3";
    default:
      return "md:col-span-1 lg:col-span-1";
  }
}
