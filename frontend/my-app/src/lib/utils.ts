import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type SingleFieldUpdate<T> = {
  [K in keyof T]: Required<Pick<T, K>> &
    Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

export async function calculateFileHash(file: File): Promise<string> {
  // Read the file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  // Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
