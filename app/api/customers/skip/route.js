import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { customerId, serviceDate, reason } = await request.json();

    if (!customerId || !serviceDate) {
      return NextResponse.json(
        { error: 'Customer ID and service date are required' },
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
      .select('user_id, next_service, status')
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

    if (customer.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot skip service for inactive customer' },
        { status: 400 }
      );
    }

    // Insert skipped service record
    const { data: skippedService, error: skipError } = await supabase
      .from('skipped_services')
      .insert({
        customer_id: customerId,
        service_date: serviceDate,
        reason: reason || null,
        created_by: user.id
      })
      .select()
      .single();

    if (skipError) {
      // If it's a duplicate, that's okay - service already skipped
      if (skipError.code === '23505') {
        return NextResponse.json(
          { message: 'Service already skipped for this date', skipped: true },
          { status: 200 }
        );
      }
      throw skipError;
    }

    // Calculate next service date based on frequency
    const { data: customerFull, error: fetchError } = await supabase
      .from('customers')
      .select('frequency, next_service')
      .eq('id', customerId)
      .single();

    if (!fetchError && customerFull) {
      let nextServiceDate = new Date(serviceDate);
      
      switch (customerFull.frequency) {
        case 'weekly':
          nextServiceDate.setDate(nextServiceDate.getDate() + 7);
          break;
        case 'bi_weekly':
          nextServiceDate.setDate(nextServiceDate.getDate() + 14);
          break;
        case 'monthly':
          nextServiceDate.setMonth(nextServiceDate.getMonth() + 1);
          break;
        default:
          // For one_time or seasonal, don't update
          break;
      }

      // Only update if frequency is recurring
      if (['weekly', 'bi_weekly', 'monthly'].includes(customerFull.frequency)) {
        await supabase
          .from('customers')
          .update({ next_service: nextServiceDate.toISOString().split('T')[0] })
          .eq('id', customerId);
      }
    }

    return NextResponse.json({
      message: 'Service skipped successfully',
      skipped: skippedService
    });
  } catch (error) {
    console.error('Error skipping service:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to skip service' },
      { status: 500 }
    );
  }
}

