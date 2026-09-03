// app/api/test-rst/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions, fetchSupabaseApi } from '@/lib/supabase-helper';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, tester } = body;
 
    // 필수 파라미터 검증 (startDate와 tester만 필수)
    if (!startDate || !tester) {
      return NextResponse.json(
        { 
          success: false, 
          message: '필수 파라미터 누락: startDate와 tester는 필수 입력값입니다.' 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // startDate를 기반으로 endDate(+1일) 자동 계산 (YYYY-MM-DD 형식)
    const [year, month, day] = startDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + 1);
    const endDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // Supabase REST API 쿼리스트링 조합
    const queryParams = new URLSearchParams();
    queryParams.append('select', '*');
    queryParams.append('TEST_DATE', `gte.${startDate}`);
    queryParams.append('TEST_DATE', `lt.${endDate}`);
    queryParams.append('TESTER', `eq.${tester}`);
    queryParams.append('order', 'TEST_GRP_NM.asc,TEST_SCORE.desc');

    // 공통 함수를 이용해 'TEST_RST' 테이블 조회[cite: 1]
    const data = await fetchSupabaseApi(`/rest/v1/TEST_RST?${queryParams.toString()}`, 'GET');

    return NextResponse.json({ success: true, data }, { status: 200, headers: corsHeaders }); //[cite: 1]

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.', error: error.error || error.message },
      { status: error.status || 500, headers: corsHeaders } //[cite: 1]
    );
  }
}