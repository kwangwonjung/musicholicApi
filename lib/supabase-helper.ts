// lib/supabase-helper.ts
import { NextResponse } from 'next/server';
import { supabaseUrl, supabaseServiceKey } from '@/lib/supabase';

// CORS 허용 헤더 공통화
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 요청 처리 공통화[cite: 1]
export function handleOptions() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// Supabase REST API 통신 공통 함수 (일반 쿼리 및 RPC 공용)
export async function fetchSupabaseApi(path: string, method: string = 'GET', body?: any) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw { status: 500, error: 'Supabase 환경변수가 설정되지 않았습니다.' };
  }

  const endpoint = new URL(`${supabaseUrl}${path}`);

  const response = await fetch(endpoint.toString(), {
    method,
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw { status: response.status, error: errorData };
  }

  return await response.json();
}