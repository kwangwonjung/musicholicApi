import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions, fetchSupabaseApi } from '@/lib/supabase-helper';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, startDate, endDate, tester, testGrpNm } = body;

    console.log('--- [DEBUG] 최종 추출된 값:', { mode, startDate, endDate, tester, testGrpNm });

    // Supabase RPC 함수 호출[cite: 4]
    const data = await fetchSupabaseApi('/rest/v1/rpc/get_test_period', 'POST', {
      p_mode: mode,
      p_start_date: startDate,
      p_end_date: endDate,
      p_tester: tester,
      p_test_grp_nm: testGrpNm,
    });

    // Supabase에서 반환된 플랫 데이터를 요구하신 그룹 형태 구조로 변환[cite: 4]
    const groupedMap = new Map();

    if (Array.isArray(data)) {
      data.forEach((row: any) => {
        const testerName = row.tester || row.TESTER;
        if (!groupedMap.has(testerName)) {
          groupedMap.set(testerName, {
            TESTER: testerName,
            TOTAL_CNT: row.total_count || row.TOTAL_CNT || 0,
            subjects: [],
          });
        }
        groupedMap.get(testerName).subjects.push({
          MODE: row.mode || row.MODE,
          TEST_GRP_NM: row.test_grp_nm || row.TEST_GRP_NM,
          AVG_SCORE: row.avg_score ?? row.AVG_SCORE,
          SOLVE_CNT: row.solve_cnt ?? row.SOLVE_CNT,
          UNIQUE_DAYS: row.unique_days ?? row.UNIQUE_DAYS,
          MAX_SCORE: row.max_score ?? row.MAX_SCORE,
          HINT_MAX: row.hint_max ?? row.HINT_MAX,
          MIN_SCORE: row.min_score ?? row.MIN_SCORE,
          HINT_MIN: row.hint_min ?? row.HINT_MIN,
        });
      });
    }

    const formattedData = Array.from(groupedMap.values());

    return NextResponse.json({ success: true, data: formattedData }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.', error: error.error || error.message },
      { status: error.status || 500, headers: corsHeaders }
    );
  }
}