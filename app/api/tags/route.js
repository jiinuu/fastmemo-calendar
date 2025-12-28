import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Missing" },
        { status: 500 }
      );
    }

    const { text, url, title, image } = await request.json();

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
사용자가 웹브라우저에서 메모를 저장했습니다. 이 메모에 대해 나중에 검색하고 관리하기 쉬운 태그를 3~5개 생성해 주세요.
태그는 반드시 배열 형태의 JSON으로 응답해 주세요 (예: ["태그1", "태그2", "태그3"]).

입력 정보:
- 제목: ${title || "없음"}
- 내용: ${text || "없음"}
- URL: ${url || "없음"}

가이드라인:
1. 사용자의 의도를 추론하세요. (예: 유튜브 강의라면 "학습", 쇼핑몰이라면 "장바구니" 또는 "위시리스트")
2. 특정 서비스에 종속된 태그보다는 의미론적으로 도움이 되는 태그를 우선하세요.
3. 이미지가 함께 제공되었다면 (멀티모달), 이미지의 내용을 분석하여 태그에 반영하세요. 
4. 응답은 오직 JSON 배열만 포함해야 하며, 설명이나 마크다운 코드 블록을 포함하지 마세요.
`;

    const parts = [{ text: prompt }];

    // 이미지가 있는 경우 멀티모달 처리
    if (image && image.startsWith("data:image")) {
      const base64Data = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const rawText = response.text().trim();

    // JSON 추출 (코드 블록이나 잡다한 텍스트 방어)
    let tags = [];
    try {
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0]);
      } else {
        tags = JSON.parse(rawText);
      }
    } catch (e) {
      console.error("Failed to parse tags JSON:", rawText);
      // 포맷 실패 시 간단한 대체 로직이나 빈 배열
      tags = ["자동생성"];
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Tagging API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
