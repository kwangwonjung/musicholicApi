// app/api/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions, fetchSupabaseApi } from '@/lib/supabase-helper';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, tester } = body;
 
    // 필수 값 검증
    if (!year || !month || !tester) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터 누락: year, month, tester는 필수 입력값입니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 공통 함수를 통한 Supabase RPC 호출
    const data = await fetchSupabaseApi('/rest/v1/rpc/get_tester_calendar', 'POST', {
      target_year: Number(year),
      target_month: Number(month),
      p_tester: tester,
    });

    return NextResponse.json({ success: true, data }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.', error: error.error || error.message },
      { status: error.status || 500, headers: corsHeaders }
    );
  }
}