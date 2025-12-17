import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    // 1. API 키 확인
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API Key Missing: Vercel Settings에서 환경변수를 확인하세요." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, currentDate } = body;

    // ✨ [수정된 부분] 모델 이름을 최신 버전인 'gemini-1.5-flash'로 변경!
    // (기존 'gemini-pro'는 이제 안 됩니다)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    return NextResponse.json(
      { error: `AI Error: ${error.message}` }, 
      { status: 500 }
    );
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