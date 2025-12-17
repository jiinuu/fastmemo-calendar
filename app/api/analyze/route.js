import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const runtime = "nodejs"; // Edge면 SDK 동작 이슈 날 수 있어서 Node 권장

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // 너는 GOOGLE_GEMINI_API_KEY를 써도 되지만, 여기선 명시적으로
});

const eventSchema = z.object({
  title: z.string(),
  date: z.string(), // "YYYY-MM-DD"
  summary: z.string(),
  reminderDate: z.string().optional(),
});
const eventsSchema = z.array(eventSchema);

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Missing: 환경변수 GEMINI_API_KEY 확인" },
        { status: 500 }
      );
    }

    // 🔥 안전: 요청 시점에 생성
    const ai = new GoogleGenAI({ apiKey });

    const { text, currentDate } = await request.json();

    const prompt = `
현재 날짜: ${currentDate}
웹페이지 텍스트: ${String(text).substring(0, 10000)}

위 내용을 분석해서 사용자가 캘린더에 등록할만한 일정(구독 갱신, 마감일 등)을 "JSON 배열"로만 반환해.
- 반드시 각 항목은 title, date(YYYY-MM-DD), summary 를 포함해야 해.
- 해당되는 일정이 없으면 [] 만 반환해.
- 마크다운/설명/코드블록 절대 금지.
- '구독 갱신'이나 '결제' 관련이면 reminderDate를 date의 3일 전으로 넣어줘(옵션).
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(eventsSchema),
      },
    });

    const raw = (response.text ?? "").trim();

    // ✅ 1차 파싱
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // JSON 자체가 깨진 경우: 빈 배열로 처리(서버 500 방지)
      console.error("JSON parse failed. Raw:", raw);
      return NextResponse.json([]);
    }

    // ✅ 2차 검증: safeParse로 서버가 안 죽게
    const validated = eventsSchema.safeParse(parsed);

    if (validated.success) {
      return NextResponse.json(validated.data);
    }

    // ✅ 3차: 배열이라면 “정상 항목만” 골라서 반환
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((x) => x && typeof x === "object")
        .filter((x) => typeof x.title === "string" && typeof x.date === "string" && typeof x.summary === "string")
        .map((x) => ({
          title: x.title,
          date: x.date,
          summary: x.summary,
          reminderDate: typeof x.reminderDate === "string" ? x.reminderDate : undefined,
        }));

      return NextResponse.json(cleaned);
    }

    // 그 외 형식이면 그냥 빈 배열
    console.error("Zod validation failed:", validated.error?.issues, "Raw:", raw);
    return NextResponse.json([]);
  } catch (error) {
    console.error("🔥 AI Error Detail:", error);
    return NextResponse.json(
      { error: `AI Error: ${error?.message ?? String(error)}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
