import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { userId, email, name, phone, address, service, referralCode, quoteAlreadySent } = await request.json();

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

    // Check if customer already exists by user_id
    const { data: existingCustomerArray } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
      
    const existingCustomer = existingCustomerArray?.[0];

    const serviceSlug = {
      'Lawn Mowing': 'lawn_mowing',
      'Mulching': 'mulch_installation',
      'Spring Cleanup': 'spring_cleanup',
      'Fall Cleanup': 'fall_cleanup',
      'Leaf Removal': 'fall_cleanup',
      'Hedge Trimming': 'landscaping',
    }[service] || 'lawn_care';

    const serviceNote = service ? `Service needed: ${service}` : '';

    const saveLead = async () => {
      if (!service) return;
      const lead = {
        customer_name: name || email.split('@')[0],
        customer_email: email,
        customer_phone: phone || null,
        service_type: service,
        address: address || null,
        status: 'pending',
        notes: 'Created with a new yard account.',
        lead_source: 'account_signup',
      };
      const { error: leadError } = await supabaseAdmin.from('contact_leads').insert([lead]);
      if (!leadError) return;
      await supabaseAdmin.from('contact_leads').insert([{
        customer_name: lead.customer_name,
        customer_email: lead.customer_email,
        customer_phone: lead.customer_phone,
        service_type: lead.service_type,
        status: 'pending',
        notes: `${serviceNote}\nAddress: ${address || 'Not provided'}`,
      }]);
    };

    if (existingCustomer) {
      const patch = {};
      if (name && name !== 'New Customer') patch.name = name;
      if (phone && phone !== 'Not provided') patch.phone = phone;
      if (address) patch.address = address;
      if (service) {
        patch.service_type = serviceSlug;
        patch.notes = serviceNote;
      }
      if (Object.keys(patch).length) {
        await supabaseAdmin.from('customers').update(patch).eq('id', existingCustomer.id);
      }
      if (service && !quoteAlreadySent) await saveLead();
      return NextResponse.json({
        success: true,
        message: 'Customer already exists',
        customerId: existingCustomer.id
      });
    }

    // Also check by email (using limit 1 to prevent multiple row crash)
    const { data: existingByEmailArray } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .limit(1);
      
    const existingByEmail = existingByEmailArray?.[0];

    if (existingByEmail) {
      const patch = { user_id: userId };
      if (name) patch.name = name;
      if (phone) patch.phone = phone;
      if (address) patch.address = address;
      if (service) {
        patch.service_type = serviceSlug;
        patch.notes = serviceNote;
      }
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update(patch)
        .eq('id', existingByEmail.id);

      if (updateError) {
        console.error('Error updating customer user_id:', updateError);
      }
      if (service && !quoteAlreadySent) await saveLead();

      return NextResponse.json({
        success: true,
        message: 'Customer linked to user account',
        customerId: existingByEmail.id
      });
    }

    const customerNotes = [
      `Auto-created from signup on ${new Date().toLocaleDateString()}.`,
      serviceNote,
      referralCode ? `Referral code used: ${referralCode}` : '',
    ].filter(Boolean).join('\n');
    
    const { data: newCustomer, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert([
        {
          user_id: userId,
          name: name || 'New Customer',
          email: email,
          phone: phone || 'Not provided',
          address: address || null,
          service_type: service ? serviceSlug : 'lawn_mowing',
          frequency: 'one_time',
          price: 0,
          status: 'pending',
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

    if (!quoteAlreadySent) await saveLead();

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

