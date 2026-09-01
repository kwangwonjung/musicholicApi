import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseUrl, supabaseServiceKey } from '@/lib/supabase'; // ⭐️ 공통 변수 임포트

export async function POST(request: Request) {
  try {
    // 1. 클라이언트에서 보낸 데이터 받기
    const { to, subject, html, ...testData } = await request.json();
    
    // DB 저장이 실패하면 에러를 던지고(catch 블록으로 이동) 메일 발송이 취소됩니다.
    await insertTestResultToSupabase(testData);

    let bcc = "musicholic80@gmail.com";

    // 2. 네이버 이메일 전송 설정 (SMTP)
    const transporter = nodemailer.createTransport({
      host: 'smtp.naver.com', // 네이버 SMTP 서버
      port: 465,             // SSL 포트
      secure: true,          // 465 포트는 true 사용
      auth: {
        user: process.env.SEND_EMAIL,
        pass: process.env.SEND_PASS,
      },
    });

    // 3. 이메일 보내기
    await transporter.sendMail({
      from: process.env.SEND_EMAIL, // 보내는 사람 (본인 네이버 메일)
      to,                            // 받는 사람
      bcc,
      subject,                       // 메일 제목
      html,                          // HTML 본문 내용
    });

    return NextResponse.json({ message: '네이버 메일이 성공적으로 전송되었습니다!' }, { status: 200 });
  } catch (error) {
    console.error('네이버 메일 전송 실패:', error);
    return NextResponse.json({ message: '메일 전송 중 오류 발생', error: String(error) }, { status: 500 });
  }
}

async function insertTestResultToSupabase(data: any) {
  const endpoint = `${supabaseUrl}/rest/v1/TEST_RST`;
  const score = Number(data.TEST_SCORE) || 0;
  let useYn = score < 60 ? 'Y' : 'N';

  if (useYn === 'N') {
    const testDateStr = data.TEST_DATE ? data.TEST_DATE.split('T')[0] : new Date().toISOString().split('T')[0];
    const targetDate = new Date(testDateStr);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const todayStr = targetDate.toISOString().split('T')[0];
    const tomorrowStr = nextDate.toISOString().split('T')[0];

    // 1. SELECT MAX("TEST_SCORE") 조회 로직
    const params = new URLSearchParams();
    params.append('select', 'TEST_SCORE');
    params.append('TEST_DATE', `gte.${todayStr}`);
    params.append('TEST_DATE', `lt.${tomorrowStr}`);
    params.append('USE_YN', 'eq.N');
    params.append('TESTER', `eq.${data.TESTER}`);
    params.append('TEST_GRP_NM', `eq.${data.TEST_GRP_NM}`);
    params.append('MODE', `eq.${data.MODE}`);
    params.append('order', 'TEST_SCORE.desc');
    params.append('limit', '1');

    const getResponse = await fetch(`${supabaseUrl}/rest/v1/TEST_RST?${params.toString()}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey!,
        'Authorization': `Bearer ${supabaseServiceKey!}`,
      },
    });

    if (getResponse.ok) {
      const rows = await getResponse.json();
      if (rows && rows.length > 0) {
        const maxScore = Number(rows[0].TEST_SCORE) || 0;
        console.log('maxScore : ' + maxScore);
        
        if (score < maxScore) {
          useYn = 'Y';
        } else {
          useYn = 'N';
          
        }
      }
    }

    console.log('useYn : ' + useYn);

    // 2. 여전히 useYn이 'N'인 경우 요청하신 UPDATE(PATCH) 문구 실행
    if (useYn === 'N') {
      const updateParams = new URLSearchParams();
      updateParams.append('TEST_DATE', `gte.${todayStr}`);
      updateParams.append('TEST_DATE', `lt.${tomorrowStr}`);
      updateParams.append('USE_YN', 'eq.N');
      updateParams.append('TESTER', `eq.${data.TESTER}`);
      updateParams.append('TEST_GRP_NM', `eq.${data.TEST_GRP_NM}`);
      updateParams.append('MODE', `eq.${data.MODE}`);
      updateParams.append('TEST_SCORE', `lt.${score}`);

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/TEST_RST?${updateParams.toString()}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey!,
          'Authorization': `Bearer ${supabaseServiceKey!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          USE_YN: 'Y',
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`기존 데이터 상태 업데이트 실패: ${JSON.stringify(errorData)}`);
      }
    }
  }
  
  console.log('useYn : ' + useYn);
  // 3. 새로운 시험 결과 데이터 삽입 (INSERT)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey!,
      'Authorization': `Bearer ${supabaseServiceKey!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      TESTER: data.TESTER || null,
      TEST_DATE: data.TEST_DATE || null,
      TEST_GRP_NM: data.TEST_GRP_NM || null,
      TEST_SCORE: data.TEST_SCORE || null,
      CORRECT_CNT: data.CORRECT_CNT || null,
      TOTAL_CNT: data.TOTAL_CNT || null,
      DURATION: data.DURATION || null,
      USE_YN: useYn,
      MODE: data.MODE || null,
      HINT_CNT: data.HINT_CNT || null,
      LANG: data.LANG || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DB 저장 실패: ${JSON.stringify(errorData)}`);
  }
}