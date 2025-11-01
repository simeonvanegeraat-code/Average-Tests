import { clsx } from "clsx";
import { twMerge } from "./twMerge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
