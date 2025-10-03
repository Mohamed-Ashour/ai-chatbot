import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'ai-chatbot-client',
    timestamp: new Date().toISOString()
  });
}