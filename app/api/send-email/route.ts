import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    // 1. 클라이언트에서 보낸 데이터 받기
    const { to, subject, html } = await request.json();

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