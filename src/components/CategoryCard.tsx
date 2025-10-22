import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string; // tailwind gradient classes
};

export default function CategoryCard({ slug, title, subtitle, emoji, color }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group block rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition"
      aria-label={`${title} category`}
    >
      <div className={`h-24 w-full bg-gradient-to-r ${color} opacity-90 group-hover:opacity-100 transition`} />
      <div className="p-5">
        <div className="text-3xl mb-2">{emoji}</div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      </div>
    </Link>
  );
}
