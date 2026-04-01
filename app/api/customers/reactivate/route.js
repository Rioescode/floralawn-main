import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the customer belongs to this user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('user_id, status')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - this customer does not belong to you' },
        { status: 403 }
      );
    }

    if (customer.status === 'active') {
      return NextResponse.json(
        { message: 'Service already active', customer },
        { status: 200 }
      );
    }

    // Reactivate customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        status: 'active'
      })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: 'Service reactivated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error reactivating service:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reactivate service' },
      { status: 500 }
    );
  }
}

