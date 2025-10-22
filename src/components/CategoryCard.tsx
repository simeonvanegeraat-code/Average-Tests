import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string; // gradient classes (we gebruiken alleen halo)
};

export default function CategoryCard({ slug, title, subtitle, emoji }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group relative block rounded-3xl border border-gray-200 bg-white elev-1 hover:elev-2 transition will-change-transform"
      aria-label={`${title} category`}
    >
      {/* Halo accent */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400/10 via-sky-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition" />
      <div className="relative flex h-44 md:h-48 items-center justify-center text-center p-6">
        <div className="max-w-[18rem]">
          <div className="text-4xl md:text-5xl mb-3 select-none">{emoji}</div>
          <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
