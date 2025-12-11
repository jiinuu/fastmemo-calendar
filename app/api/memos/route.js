import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. 컬렉션 이름: "Fast Memo" (띄어쓰기 포함)
    const q = query(collection(db, "memos"), orderBy("createdAt", "desc")); 
    const querySnapshot = await getDocs(q);

    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();

      // [핵심] 날짜 변환 로직 (보여주신 createdAt 숫자 활용)
      // 1765431744796 -> "2025-12-11" 로 변환
      let dateStr = new Date().toISOString().split('T')[0]; // 기본값: 오늘
      
      if (data.createdAt) {
        dateStr = new Date(data.createdAt).toISOString().split('T')[0];
      }

      return {
        id: doc.id,
        title: data.text || "내용 없음", // 'text' 필드를 제목으로 사용
        date: dateStr,
        // (옵션) 클릭 시 원본 URL 이동 등을 위해 추가 정보 넘김
        extendedProps: {
          url: data.url
        }
      };
    });

    // 데이터가 잘 만들어졌는지 서버 로그로 확인
    console.log(`✅ 데이터 ${events.length}개 로드 성공! 첫번째 날짜: ${events[0]?.date}`);

    return NextResponse.json(events);
  } catch (error) {
    console.error("❌ 파이어베이스 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST는 기존과 동일하게 유지하거나 필요하면 수정
export async function POST(request) {
    return NextResponse.json({ message: "Not implemented for view check" });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}