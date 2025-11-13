import { NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

async function postHandler(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const success = await createAdminSession(username, password);

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    logError(request, error, { operation: 'admin_login' });
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withLogging(postHandler);
