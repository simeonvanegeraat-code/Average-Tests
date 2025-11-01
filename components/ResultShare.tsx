"use client";

export default function ResultShare({
  url,
  pct,
  slug,
}: {
  url: string;
  pct: number;
  slug: string;
}) {
  // In de browser nemen we de echte URL over (handig bij preview/andere domeinen)
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : url;

  const tweetText = `My sleep habits score: ${pct}% — via HumanAverage`;
  const redditTitle = `My sleep habits score: ${pct}%`;

  return (
    <div className="mt-6 flex flex-wrap gap-3 justify-center">
      <a
        className="px-4 py-2 rounded-lg bg-black text-white"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          tweetText
        )}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on X
      </a>

      <a
        className="px-4 py-2 rounded-lg bg-[#1877F2] text-white"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on Facebook
      </a>

      <a
        className="px-4 py-2 rounded-lg bg-[#FF4500] text-white"
        href={`https://www.reddit.com/submit?url=${encodeURIComponent(
          shareUrl
        )}&title=${encodeURIComponent(redditTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on Reddit
      </a>

      <button
        className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
        onClick={() => {
          try {
            navigator.clipboard?.writeText(shareUrl);
          } catch {}
        }}
      >
        Copy Link
      </button>
    </div>
  );
}
