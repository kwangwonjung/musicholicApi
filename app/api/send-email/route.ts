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

  // 60점 미만이면 'Y', 아니면 'N' (상황에 따라 'N' 대신 null을 넣고 싶다면 null로 변경하세요)
  const useYn = score < 60 ? 'Y' : 'N';

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
      USE_YN : useYn,
      MODE :data.MODE || null,
      HINT_CNT :data.HINT_CNT || null
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DB 저장 실패: ${JSON.stringify(errorData)}`);
  }
}