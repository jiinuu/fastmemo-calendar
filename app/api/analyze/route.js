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
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API Key Missing: 환경변수 GEMINI_API_KEY 확인" },
        { status: 500 }
      );
    }

    const { text, currentDate } = await request.json();

    const prompt = `
현재 날짜: ${currentDate}
웹페이지 텍스트: ${String(text).substring(0, 10000)}

위 내용을 분석해서 사용자가 캘린더에 등록할만한 일정(구독 갱신, 마감일 등)을 추출해.
특히 '구독 갱신'이나 '결제' 관련이면 해당 날짜의 3일 전을 reminderDate로 넣어줘.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 또는 "gemini-2.0-flash"
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(eventsSchema),
      },
    });

    const data = eventsSchema.parse(JSON.parse(response.text));
    return NextResponse.json(data);
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
