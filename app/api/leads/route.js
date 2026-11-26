import { requireAdmin } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { contactLeadIntakePayload, sendToMgr } from '@/libs/mgr-crew-intake';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck.response) return adminCheck.response;

  try {
    const body = await request.json();
    
    const { error, data } = await supabaseAdmin
      .from('contact_leads')
      .insert([{
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        address: body.address,
        service_type: body.service_type,
        notes: body.notes,
        visit_date: body.visit_date,
        status: body.status || 'confirmed',
        lead_source: 'manual_entry',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    if (data?.id != null) {
      try {
        await sendToMgr(contactLeadIntakePayload(data));
      } catch {
        // Best-effort. The lead is already saved.
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck.response) return adminCheck.response;

  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('contact_leads')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck.response) return adminCheck.response;

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('contact_leads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
