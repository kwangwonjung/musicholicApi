import { NextRequest, NextResponse } from 'next/server';

// CORS 허용 헤더 (개발 중에는 '*'로 전체 허용, 나중에는 실제 프론트엔드 주소로 변경 가능)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 1. 브라우저의 Preflight (OPTIONS) 요청 처리 (405 에러 방지 핵심)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. 실제 POST 요청 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, useYn, tester } = body;

    console.log("startDate : " + startDate);
    console.log("endDate : " + endDate);
    console.log("useYn : " + useYn);
    console.log("tester : " + tester);


    // 필수 값 검증
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터 누락: startDate와 endDate는 필수 입력값입니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase 환경변수가 설정되지 않았습니다.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // URL 객체 생성 및 PostgREST 쿼리 파라미터 조합
    const endpoint = new URL(`${supabaseUrl}/rest/v1/V_TEST_RST`);
    
    endpoint.searchParams.append('select', '*');
    endpoint.searchParams.append('TEST_DATE', `gte.${startDate}`);
    endpoint.searchParams.append('TEST_DATE', `lt.${endDate}`);
    endpoint.searchParams.append('order', 'TEST_DATE.desc,TEST_SCORE.asc');

    if (useYn) {
      endpoint.searchParams.append('USE_YN', `eq.${useYn}`);
    }
    
    if (tester) {
      endpoint.searchParams.append('TESTER', `eq.${tester}`);
    }

    // 외부 Supabase REST API 호출
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: 'DB 조회 실패', error: errorData },
        { status: 500, headers: corsHeaders }
      );
    }

    const data = await response.json();

    // 성공 응답 반환 (CORS 헤더 포함)
    return NextResponse.json({ success: true, data }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.', error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}