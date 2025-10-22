import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
};

export default function CategoryCard({ slug, title, subtitle, emoji, color }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      aria-label={`${title} category`}
      className="group relative block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {/* Neon halo on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 transition`} />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-black/5 dark:group-hover:ring-white/10 transition" />

      <div className="relative flex h-44 md:h-48 items-center justify-center text-center p-6">
        <div>
          <div className="text-4xl md:text-5xl mb-3 select-none">{emoji}</div>
          <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
