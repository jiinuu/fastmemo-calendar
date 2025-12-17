import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// ⚠️ 함수 이름은 무조건 대문자 "POST" 여야 합니다.
export async function POST(request) {
  try {
    const body = await request.json(); // 데이터 받기
    const { text, currentDate } = body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      현재 날짜: ${currentDate}
      웹페이지 텍스트: ${text.substring(0, 10000)}

      위 내용을 분석해서 사용자가 캘린더에 등록할만한 일정(구독 갱신, 마감일 등)을 JSON 배열로 반환해.
      특히 '구독 갱신'이나 '결제' 관련이면 해당 날짜의 3일 전 날짜를 'reminderDate' 필드에 넣어줘.
      
      Output JSON Format:
      [
        { "title": "일정 제목", "date": "YYYY-MM-DD", "summary": "요약", "reminderDate": "YYYY-MM-DD (옵션)" }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textData = response.text();
    const cleanedText = textData.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ⚠️ CORS 에러 방지를 위해 OPTIONS 함수도 필수입니다.
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