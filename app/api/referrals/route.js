import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Regular client for user operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch referrals for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const code = searchParams.get('code');
    const all = searchParams.get('all') === 'true';

    // If admin wants all referrals
    if (all) {
      const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ referrals: data || [] });
    }

    // If checking a specific referral code
    if (code) {
      const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return NextResponse.json({ referral: data });
    }

    // Get referrals for a user - use admin client to bypass RLS
    let query = supabaseAdmin.from('referrals').select('*');

    if (userId) {
      query = query.or(`referrer_id.eq.${userId},referee_id.eq.${userId}`);
    } else if (customerId) {
      query = query.or(`referrer_customer_id.eq.${customerId},referee_customer_id.eq.${customerId}`);
    } else {
      return NextResponse.json({ error: 'userId or customerId required' }, { status: 400 });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ referrals: data || [] });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

// POST - Create a new referral or track a referral usage
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, customerId, referralCode, refereeEmail, refereeName, refereePhone } = body;

    // Action: 'create' - Generate referral code for a user
    if (action === 'create') {
      // Check if user already has a referral code (check by both user_id and customer_id)
      let existing = null;
      
      if (userId) {
        const { data } = await supabaseAdmin
          .from('referrals')
          .select('referral_code, id')
          .eq('referrer_id', userId)
          .eq('status', 'pending') // Only check pending records (the user's own code)
          .limit(1)
          .maybeSingle();
        existing = data;
      }
      
      // Also check by customer_id if not found and customerId is provided
      if (!existing && customerId) {
        const { data } = await supabaseAdmin
          .from('referrals')
          .select('referral_code, id')
          .eq('referrer_customer_id', customerId)
          .eq('status', 'pending') // Only check pending records (the user's own code)
          .limit(1)
          .maybeSingle();
        existing = data;
      }

      if (existing) {
        return NextResponse.json({ 
          referralCode: existing.referral_code,
          message: 'Referral code already exists'
        });
      }

      // Get user info to populate referrer details
      let referrerEmail = '';
      let referrerName = '';
      
      if (userId) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (userData?.user) {
            referrerEmail = userData.user.email || '';
            referrerName = userData.user.user_metadata?.full_name || 
                          userData.user.user_metadata?.name || 
                          referrerEmail.split('@')[0] || '';
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
        }
      }
      
      // Also try to get customer info if customerId is provided
      if (customerId && (!referrerName || !referrerEmail)) {
        try {
          const { data: customerData } = await supabaseAdmin
            .from('customers')
            .select('name, email')
            .eq('id', customerId)
            .single();
          
          if (customerData) {
            referrerName = customerData.name || referrerName;
            referrerEmail = customerData.email || referrerEmail;
          }
        } catch (customerError) {
          console.error('Error fetching customer data:', customerError);
        }
      }

      // Generate referral code directly - FLORA + 6 random alphanumeric characters
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (0, O, I, 1)
      let referralCode = 'FLORA';
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      // Keep generating until we find a unique code
      while (codeExists && attempts < maxAttempts) {
        referralCode = 'FLORA';
        for (let i = 0; i < 6; i++) {
          referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if code already exists
        const { data: existingCode } = await supabaseAdmin
          .from('referrals')
          .select('id')
          .eq('referral_code', referralCode)
          .limit(1)
          .maybeSingle();

        codeExists = !!existingCode;
        attempts++;
      }

      if (codeExists) {
        throw new Error('Failed to generate unique referral code after multiple attempts');
      }

      // Ensure we have at least email or name before creating
      if (!referrerEmail && !referrerName) {
        throw new Error('Unable to create referral code: missing user information');
      }

      const { data: newReferral, error: insertError } = await supabaseAdmin
        .from('referrals')
        .insert([{
          referrer_id: userId || null,
          referrer_customer_id: customerId || null,
          referrer_email: referrerEmail || null,
          referrer_name: referrerName || null,
          referral_code: referralCode,
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating referral code:', insertError);
        throw insertError;
      }
      
      console.log('Successfully created referral code:', { referralCode, referralId: newReferral.id });
      return NextResponse.json({ referralCode, referral: newReferral });
    }

    // Action: 'regenerate' - Regenerate referral code to new format
    if (action === 'regenerate') {
      const { referralId } = body;
      
      if (!referralId) {
        return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });
      }

      // Generate new referral code in FLORA format
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = 'FLORA';
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      while (codeExists && attempts < maxAttempts) {
        newCode = 'FLORA';
        for (let i = 0; i < 6; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const { data: existingCode } = await supabase
          .from('referrals')
          .select('id')
          .eq('referral_code', newCode)
          .limit(1)
          .single();

        codeExists = !!existingCode;
        attempts++;
      }

      if (codeExists) {
        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
      }

      // Update the referral code
      const { data: updatedReferral, error: updateError } = await supabase
        .from('referrals')
        .update({ referral_code: newCode })
        .eq('id', referralId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ 
        success: true, 
        referralCode: newCode, 
        referral: updatedReferral 
      });
    }

    // Action: 'track' - Track when someone uses a referral code
    if (action === 'track') {
      if (!referralCode) {
        return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
      }

      // Find the referrer's original referral record (to get their info)
      const { data: referrerRecord, error: findError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode.toUpperCase())
        .eq('status', 'pending') // Find the original pending record (the referrer's code)
        .limit(1)
        .maybeSingle();

      // If no pending record found, try to find any record with this code to get referrer info
      let referrerInfo = null;
      if (!referrerRecord) {
        const { data: anyRecord } = await supabaseAdmin
          .from('referrals')
          .select('referrer_id, referrer_customer_id, referrer_email, referrer_name, referral_code')
          .eq('referral_code', referralCode.toUpperCase())
          .limit(1)
          .maybeSingle();
        
        if (!anyRecord) {
          return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }
        referrerInfo = anyRecord;
      } else {
        referrerInfo = referrerRecord;
      }

      // Check if this specific person (by email or user_id) has already used this referral code
      if (refereeEmail && refereeEmail.trim()) {
        const { data: existingReferee } = await supabaseAdmin
          .from('referrals')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .eq('referee_email', refereeEmail.toLowerCase().trim())
          .maybeSingle();

        if (existingReferee) {
          return NextResponse.json({ 
            error: 'You have already used this referral code',
            alreadyUsed: true
          }, { status: 400 });
        }
      }
      
      // Also check by user_id if available
      if (userId) {
        const { data: existingRefereeById } = await supabaseAdmin
          .from('referrals')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .eq('referee_id', userId)
          .maybeSingle();

        if (existingRefereeById) {
          return NextResponse.json({ 
            error: 'You have already used this referral code',
            alreadyUsed: true
          }, { status: 400 });
        }
      }

      // Create a NEW referral record for this specific referee
      // Multiple people can use the same referral code, each gets their own record
      const { data: newReferral, error: insertError } = await supabaseAdmin
        .from('referrals')
        .insert([{
          referrer_id: referrerInfo.referrer_id,
          referrer_customer_id: referrerInfo.referrer_customer_id,
          referrer_email: referrerInfo.referrer_email,
          referrer_name: referrerInfo.referrer_name,
          referral_code: referralCode.toUpperCase(),
          referee_id: userId || null,
          referee_customer_id: customerId || null,
          referee_email: refereeEmail ? refereeEmail.toLowerCase().trim() : null,
          referee_name: refereeName || null,
          referee_phone: refereePhone || null,
          status: 'completed',
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update invitation status if there's a matching invitation
      if (refereeEmail) {
        const { error: updateInviteError } = await supabaseAdmin
          .from('referral_invitations')
          .update({ 
            status: 'signed_up',
            signed_up_at: new Date().toISOString(),
            referral_id: newReferral.id
          })
          .eq('referral_code', referralCode.toUpperCase())
          .eq('friend_email', refereeEmail.toLowerCase().trim())
          .eq('status', 'invited');

        if (updateInviteError) {
          console.error('Error updating invitation status:', updateInviteError);
          // Don't fail the main request
        }
      }

      return NextResponse.json({ 
        success: true, 
        referral: newReferral,
        message: 'Referral tracked successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in referral API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process referral' },
      { status: 500 }
    );
  }
}

// PUT - Update referral (e.g., mark as rewarded) or backfill missing referrer info
export async function PUT(request) {
  try {
    const body = await request.json();
    const { referralId, status, rewardStatus, rewardAmount, action } = body;

    // Action: 'backfill' - Update missing referrer info for all referrals
    if (action === 'backfill') {
      const { data: referralsNeedingUpdate } = await supabase
        .from('referrals')
        .select('id, referrer_id, referrer_customer_id')
        .or('referrer_email.is.null,referrer_name.is.null')
        .not('referrer_id', 'is', null)
        .limit(100);

      if (!referralsNeedingUpdate || referralsNeedingUpdate.length === 0) {
        return NextResponse.json({ success: true, updated: 0, message: 'No referrals need updating' });
      }

      let updated = 0;
      for (const ref of referralsNeedingUpdate) {
        try {
          let referrerEmail = '';
          let referrerName = '';

          // Get user info
          if (ref.referrer_id) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ref.referrer_id);
            if (userData?.user) {
              referrerEmail = userData.user.email || '';
              referrerName = userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name || 
                            referrerEmail.split('@')[0] || '';
            }
          }

          // Also try customer table
          if (ref.referrer_customer_id && (!referrerName || !referrerEmail)) {
            const { data: customerData } = await supabaseAdmin
              .from('customers')
              .select('name, email')
              .eq('id', ref.referrer_customer_id)
              .single();
            
            if (customerData) {
              referrerName = referrerName || customerData.name || '';
              referrerEmail = referrerEmail || customerData.email || '';
            }
          }

          if (referrerEmail || referrerName) {
            await supabaseAdmin
              .from('referrals')
              .update({
                referrer_email: referrerEmail || null,
                referrer_name: referrerName || null
              })
              .eq('id', ref.id);
            updated++;
          }
        } catch (err) {
          console.error(`Error updating referral ${ref.id}:`, err);
        }
      }

      return NextResponse.json({ success: true, updated, message: `Updated ${updated} referrals` });
    }

    // Regular update - use admin client to bypass RLS
    // IMPORTANT: Only update reward-related fields, NEVER touch referral_code or other core fields
    const updates = {};
    
    // Only update status if provided (but don't change it if denying reward - keep as 'completed')
    if (status && status !== 'completed') {
      updates.status = status;
    }
    
    // Update reward status
    if (rewardStatus) {
      updates.referrer_reward_status = rewardStatus;
    }
    
    // Update reward amount
    if (rewardAmount !== undefined) {
      updates.referrer_reward_amount = rewardAmount;
    }
    
    // If awarding reward
    if (status === 'rewarded' || rewardStatus === 'awarded') {
      updates.referrer_rewarded_at = new Date().toISOString();
    }
    
    // If denying/revoking reward (setting status back to pending), clear reward amount and timestamp
    // BUT keep status as 'completed' - we're only denying the reward, not the referral itself
    if (rewardStatus === 'pending' && rewardAmount === 0) {
      updates.referrer_reward_amount = 0;
      updates.referrer_rewarded_at = null;
      // Explicitly ensure status stays as 'completed' - don't change it
      // The referral was completed, we're just denying the reward
    }

    // First, fetch the current record to verify we're updating the right one
    const { data: currentRecord, error: fetchError } = await supabaseAdmin
      .from('referrals')
      .select('id, referral_code, referrer_id, referee_id, status, referrer_reward_status')
      .eq('id', referralId)
      .single();

    if (fetchError) {
      console.error('Error fetching referral record:', fetchError);
      throw new Error(`Referral record not found: ${fetchError.message}`);
    }

    console.log('Current referral record:', {
      id: currentRecord.id,
      referral_code: currentRecord.referral_code,
      referrer_id: currentRecord.referrer_id,
      referee_id: currentRecord.referee_id,
      status: currentRecord.status,
      reward_status: currentRecord.referrer_reward_status
    });

    console.log('Updating referral with:', { referralId, updates });
    console.log('NOT updating referral_code or any other core fields - only reward fields');

    // Ensure we NEVER update referral_code - explicitly exclude it
    const safeUpdates = { ...updates };
    delete safeUpdates.referral_code; // Extra safety - remove if somehow added

    const { data, error } = await supabaseAdmin
      .from('referrals')
      .update(safeUpdates)
      .eq('id', referralId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Successfully updated referral:', {
      id: data.id,
      referral_code: data.referral_code, // Verify code is still there
      status: data.status,
      reward_status: data.referrer_reward_status,
      reward_amount: data.referrer_reward_amount
    });

    return NextResponse.json({ success: true, referral: data });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update referral' },
      { status: 500 }
    );
  }
}

