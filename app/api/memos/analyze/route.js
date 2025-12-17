import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, currentDate } = body;

    // 키 확인용 로그 (Vercel 로그에서 확인 가능)
    console.log("API Key exists?", !!process.env.GOOGLE_GEMINI_API_KEY);

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error("Vercel 환경변수에 GOOGLE_GEMINI_API_KEY가 없습니다.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // 프롬프트 (기존 동일)
    const prompt = `
      현재 날짜: ${currentDate}
      웹페이지 텍스트: ${text.substring(0, 10000)}

      위 내용을 분석해서 사용자가 캘린더에 등록할만한 일정(구독 갱신, 마감일 등)을 JSON 배열로 반환해.
      특히 '구독 갱신'이나 '결제' 관련이면 해당 날짜의 3일 전 날짜를 'reminderDate' 필드에 넣어줘.
      
      Output JSON Format (only JSON, no markdown):
      [
        { "title": "일정 제목", "date": "YYYY-MM-DD", "summary": "요약", "reminderDate": "YYYY-MM-DD (옵션)" }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textData = response.text();
    
    // 마크다운 제거
    const cleanedText = textData.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error("🔥 AI Error Detail:", error);
    // [핵심] 에러 메시지를 사용자에게 그대로 보여줌
    return NextResponse.json({ error: error.message || "Unknown Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}