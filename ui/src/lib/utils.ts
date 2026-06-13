import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncatePath(path: string) {
  if (path.length <= 42) {
    return path;
  }
  return `${path.slice(0, 19)}...${path.slice(path.length - 20)}`;
}
