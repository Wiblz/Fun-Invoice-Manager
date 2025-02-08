import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type SingleFieldUpdate<T> = {
  [K in keyof T]: Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>
}[keyof T];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
