import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// .env.local에 GOOGLE_GEMINI_API_KEY를 추가해야 합니다. (없으면 OpenAI 써도 됨)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const { text, currentDate } = await request.json();

    // AI 모델 (Gemini Pro 사용 - 무료이고 텍스트 분석에 강함)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      현재 날짜: ${currentDate}
      
      사용자가 보고 있는 웹페이지 텍스트를 분석해서 다음 두 가지를 JSON 배열로 반환해.
      1. '구독 갱신', '결제', '마감', '이벤트' 같은 날짜 정보가 포함된 중요 일정.
      2. 특히 '구독 갱신'이나 '결제' 관련이라면, 해당 날짜의 **3일 전** 날짜를 계산해서 'reminderDate' 필드에 넣어줘.
      3. 일반적인 요약이 아니라, 사용자가 캘린더에 등록할만한 "Action Item" 위주로 뽑아줘.

      반환 형식(JSON Array only):
      [
        {
          "title": "Google AI Pro 갱신 (예상)",
          "date": "2026-04-05",
          "summary": "2026년 4월 5일에 갱신됩니다. 해지하려면 미리 확인하세요.",
          "reminderDate": "2026-04-02",
          "type": "subscription"
        }
      ]

      분석할 텍스트:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textData = response.text();

    // 마크다운 제거 및 JSON 파싱
    const cleanedText = textData.replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI Analysis Failed" }, { status: 500 });
  }
}

// CORS 설정 (익스텐션 접근 허용)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}