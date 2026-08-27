import { NextResponse } from 'next/server';
import { supabaseUrl, supabaseServiceKey } from '@/lib/supabase'; // ⭐️ 공통 변수 임포트

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body; // 프론트엔드에서 보낸 변경된 아이템 배열 [{ SEQ, TESTER, USE_YN }, ...]

    // 1. 데이터 유효성 검사
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: '수정할 데이터가 존재하지 않습니다.' },
        { status: 400 }
      );
    }

    // 2. 변경된 항목들을 순회하며 Supabase REST API 호출
    for (const item of items) {
      const { SEQ, TESTER, USE_YN } = item;

      console.log('SEQ :' + SEQ);
      console.log('TESTER :' + TESTER);
      console.log('USE_YN :' + USE_YN);

      if (!SEQ) continue;

      // ⭐️ Supabase REST API 업데이트 엔드포인트 (PostgREST 필터: ?SEQ=eq.값)
      const endpoint = `${supabaseUrl}/rest/v1/TEST_RST?SEQ=eq.${SEQ}`;

      const response = await fetch(endpoint, {
        method: 'PATCH', // Supabase 데이터 수정은 PATCH 사용
        headers: {
          'apikey': supabaseServiceKey!,
          'Authorization': `Bearer ${supabaseServiceKey!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal', // 응답 바디를 생략하여 성능 최적화
        },
        body: JSON.stringify({
          TESTER: TESTER || null,
          USE_YN: USE_YN || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DB 수정 실패 (SEQ: ${SEQ}): ${JSON.stringify(errorData)}`);
      }
    }

    // 3. 성공 응답 반환
    return NextResponse.json({
      success: true,
      message: '성공적으로 수정되었습니다.',
    });

  } catch (error: any) {
    console.error('Update API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}