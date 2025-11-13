import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';
import { withLogging, logError } from '@/lib/logger';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

async function getHandler(request) {
  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet') || 'FutureProject';

    const rows = await fetchSheetData(sheetName);

    return NextResponse.json({
      success: true,
      sheetName,
      totalRows: rows?.length || 0,
      firstFiveRows: rows?.slice(0, 5) || [],
      headers: rows?.[0] || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError(request, error, { operation: 'debug_sheets', sheet_name: request.url });
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const GET = withLogging(getHandler);
