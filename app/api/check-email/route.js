import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if the user already exists in either profiles or customers table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    const exists = !!profile || !!customer;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking email:', error);
    // Ignore Supabase not-found errors when using single()
    if (error.code === 'PGRST116') {
      return NextResponse.json({ exists: false });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
