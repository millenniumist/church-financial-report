import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

async function postHandler() {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(request, error, { operation: 'admin_logout' });
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withLogging(postHandler);
