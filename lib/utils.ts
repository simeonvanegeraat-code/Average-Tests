// lib/utils.ts
// Minimalistische className helper zonder externe dependencies.
// Gebruik: cn("p-4", condition && "bg-black")
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
