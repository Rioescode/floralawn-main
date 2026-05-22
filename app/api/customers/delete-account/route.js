import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // 1. Initialize Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Get the authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Find associated customer records for this user
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('user_id', user.id);

    if (customersError) {
      throw customersError;
    }

    const customerIds = customers?.map(c => c.id) || [];

    // 4. Check for unpaid balances
    if (customerIds.length > 0) {
      const { data: unpaidJobs, error: unpaidError } = await supabaseAdmin
        .from('completed_jobs')
        .select('id, balance_due')
        .in('customer_id', customerIds)
        .gt('balance_due', 0);

      if (unpaidError) {
        throw unpaidError;
      }

      if (unpaidJobs && unpaidJobs.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account. You have an unpaid balance. Please settle your balance before deleting your account.' },
          { status: 400 }
        );
      }
    }

    // 5. Unlink the customer records so the business retains history
    if (customerIds.length > 0) {
      const { error: unlinkError } = await supabaseAdmin
        .from('customers')
        .update({ user_id: null })
        .in('id', customerIds);

      if (unlinkError) {
        throw unlinkError;
      }
    }

    // 6. Delete the user from auth.users (cascades to profiles)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting your account.' },
      { status: 500 }
    );
  }
}
