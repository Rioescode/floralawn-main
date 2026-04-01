import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch loyalty transactions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId && !customerId) {
      return NextResponse.json({ error: 'userId or customerId required' }, { status: 400 });
    }

    let query = supabase
      .from('loyalty_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ transactions: data || [] });
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

