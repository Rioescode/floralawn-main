import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Call the archive function
    const { error } = await supabaseAdmin.rpc('archive_daily_completions', {
      p_date: date
    });

    if (error) {
      console.error('Error archiving daily completions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to archive daily completions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Daily completions archived for ${date}`
    });
  } catch (error) {
    console.error('Error in archive-daily-completions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive daily completions' },
      { status: 500 }
    );
  }
}

