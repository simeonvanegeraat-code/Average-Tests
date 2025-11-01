import { ImageResponse } from "@vercel/og";
import { getQuiz } from "@/lib/quizzes";

export const runtime = "edge";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const quiz = getQuiz(params.slug);
  const url = new URL(req.url);
  const score = Number(url.searchParams.get("score") || 0);
  const max = Number(url.searchParams.get("max") || 1);
  const percent = Math.round((score / max) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0b1220,#0f243e)",
          color: "white",
          fontSize: 42,
          padding: 40,
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9 }}>HumanAverage</div>
        <div style={{ fontSize: 56, fontWeight: 800, textAlign: "center", maxWidth: 900 }}>
          {quiz ? quiz.title : "Your Result"}
        </div>
        <div style={{ marginTop: 24, fontSize: 22, opacity: 0.8 }}>Your score</div>
        <div style={{ fontSize: 96, fontWeight: 900 }}>{percent}%</div>
        <div style={{ fontSize: 20, opacity: 0.8 }}>humanaverage.com</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
