import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions, fetchSupabaseApi } from '@/lib/supabase-helper';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tester = body.tester || '정진명';
    const testGrpNm = body.testGrpNm || '사자성어(5)';

    // Supabase RPC 함수 호출 (SQL 쿼리 로직이 DB에서 직접 실행됨)
    const data = await fetchSupabaseApi('/rest/v1/rpc/get_tester_grmnm_cnt', 'POST', {
      p_tester: tester,
      p_test_grp_nm: testGrpNm,
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