import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { userId, email, name, phone, address, referralCode } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available. Service role key missing.' },
        { status: 500 }
      );
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json({
        success: true,
        message: 'Customer already exists',
        customerId: existingCustomer.id
      });
    }

    // Also check by email
    const { data: existingByEmail } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail) {
      // Update existing customer to link user_id
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({ user_id: userId })
        .eq('id', existingByEmail.id);

      if (updateError) {
        console.error('Error updating customer user_id:', updateError);
      }

      return NextResponse.json({
        success: true,
        message: 'Customer linked to user account',
        customerId: existingByEmail.id
      });
    }

    // Create new customer record with pending status
    const customerNotes = `Auto-created from signup on ${new Date().toLocaleDateString()}. Waiting for admin approval.${referralCode ? ` Referral code used: ${referralCode}` : ''}`;
    
    const { data: newCustomer, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert([
        {
          user_id: userId,
          name: name || 'New Customer',
          email: email,
          phone: phone || 'Not provided',
          address: address || null,
          service_type: 'lawn_mowing', // Default service type
          frequency: 'weekly', // Default frequency
          price: 0, // Default price, admin will set later
          status: 'pending', // Set to pending for admin review
          notes: customerNotes
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create customer record', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully with pending status',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Error in create-customer-from-signup:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

