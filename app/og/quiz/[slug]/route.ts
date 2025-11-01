import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getQuiz } from "@/lib/quizzes";

export const runtime = "edge";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const quiz = getQuiz(params.slug);
  const url = new URL(req.url);
  const score = Number(url.searchParams.get("score") || 0);
  const max = Number(url.searchParams.get("max") || 1);
  const percent = Math.round((score / max) * 100);

  // ✅ Gebruik pure JS-structuur i.p.v. JSX
  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
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
        },
        children: [
          {
            type: "div",
            props: { style: { fontSize: 28, opacity: 0.9 }, children: "HumanAverage" },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 56, fontWeight: 800, textAlign: "center", maxWidth: 900 },
              children: quiz ? quiz.title : "Your Result",
            },
          },
          {
            type: "div",
            props: { style: { marginTop: 24, fontSize: 22, opacity: 0.8 }, children: "Your score" },
          },
          {
            type: "div",
            props: { style: { fontSize: 96, fontWeight: 900 }, children: `${percent}%` },
          },
          {
            type: "div",
            props: { style: { fontSize: 20, opacity: 0.8 }, children: "humanaverage.com" },
          },
        ],
      },
    },
    { width: 1200, height: 630 }
  );
}
