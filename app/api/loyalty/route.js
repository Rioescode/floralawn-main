import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch loyalty rewards for a customer or all (admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Admin view - get all loyalty rewards
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ rewards: data || [] });
    }

    if (!userId && !customerId) {
      return NextResponse.json({ error: 'userId or customerId required' }, { status: 400 });
    }

    // Get loyalty rewards for a specific customer
    let query = supabase.from('loyalty_rewards').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;

    // If no loyalty record exists, create one
    if (!data) {
      // Get customer info
      let customerInfo = {};
      if (customerId) {
        const { data: cust } = await supabase
          .from('customers')
          .select('name, email, user_id')
          .eq('id', customerId)
          .single();
        customerInfo = cust || {};
      } else if (userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        customerInfo = {
          email: userData?.user?.email || '',
          name: userData?.user?.user_metadata?.full_name || ''
        };
      }

      const { data: newReward, error: createError } = await supabase
        .from('loyalty_rewards')
        .insert([{
          user_id: userId,
          customer_id: customerId,
          customer_email: customerInfo.email,
          customer_name: customerInfo.name,
          loyalty_tier: 'bronze',
          tier_start_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json({ reward: newReward });
    }

    return NextResponse.json({ reward: data });
  } catch (error) {
    console.error('Error fetching loyalty rewards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loyalty rewards' },
      { status: 500 }
    );
  }
}

// POST - Add points or create loyalty account
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, customerId, points, serviceId, serviceType, serviceDate, description } = body;

    // Action: 'earn' - Add points for a completed service
    if (action === 'earn') {
      if (!points || points <= 0) {
        return NextResponse.json({ error: 'Points must be greater than 0' }, { status: 400 });
      }

      // Get or create loyalty reward record
      let { data: loyaltyReward } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .or(`user_id.eq.${userId || 'null'},customer_id.eq.${customerId || 'null'}`)
        .single();

      if (!loyaltyReward) {
        // Create new loyalty account
        let customerInfo = {};
        if (customerId) {
          const { data: cust } = await supabase
            .from('customers')
            .select('name, email, user_id')
            .eq('id', customerId)
            .single();
          customerInfo = cust || {};
        } else if (userId) {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          customerInfo = {
            email: userData?.user?.email || '',
            name: userData?.user?.user_metadata?.full_name || ''
          };
        }

        const { data: newReward, error: createError } = await supabase
          .from('loyalty_rewards')
          .insert([{
            user_id: userId,
            customer_id: customerId,
            customer_email: customerInfo.email,
            customer_name: customerInfo.name,
            loyalty_tier: 'bronze',
            tier_start_date: new Date().toISOString(),
            first_service_date: serviceDate || new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        loyaltyReward = newReward;
      }

      // Calculate new totals
      const newTotalPoints = (loyaltyReward.total_points || 0) + points;
      const newAvailablePoints = (loyaltyReward.available_points || 0) + points;
      const newTotalServices = (loyaltyReward.total_services_completed || 0) + 1;
      
      // Calculate new tier
      const { data: newTier } = await supabase
        .rpc('calculate_loyalty_tier', {
          total_points: newTotalPoints,
          total_services: newTotalServices
        });

      const tierChanged = newTier !== loyaltyReward.loyalty_tier;

      // Update loyalty reward
      const { data: updatedReward, error: updateError } = await supabase
        .from('loyalty_rewards')
        .update({
          total_points: newTotalPoints,
          available_points: newAvailablePoints,
          total_services_completed: newTotalServices,
          loyalty_tier: newTier || 'bronze',
          tier_start_date: tierChanged ? new Date().toISOString() : loyaltyReward.tier_start_date,
          last_service_date: serviceDate || new Date().toISOString(),
          first_service_date: loyaltyReward.first_service_date || (serviceDate || new Date().toISOString())
        })
        .eq('id', loyaltyReward.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create transaction record
      const pointValue = points * 0.02; // 1 point = $0.02 (2% back)
      const earnedDate = serviceDate || new Date().toISOString();
      const expirationDate = new Date(earnedDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Points expire 1 year after being earned
      
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          user_id: userId,
          loyalty_reward_id: loyaltyReward.id,
          transaction_type: 'earned',
          points: points,
          point_value: pointValue,
          service_id: serviceId,
          service_type: serviceType,
          service_date: earnedDate,
          expiration_date: expirationDate.toISOString(), // Set expiration to 1 year from earning
          description: description || `Earned ${points} points for ${serviceType || 'service'}`,
          status: 'active'
        }]);

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Don't fail the whole operation
      }

      return NextResponse.json({
        success: true,
        reward: updatedReward,
        tierUpgraded: tierChanged,
        message: tierChanged ? `Congratulations! You've reached ${newTier} tier!` : `Earned ${points} points`
      });
    }

    // Action: 'redeem' - Redeem points for reward
    if (action === 'redeem') {
      const { pointsToRedeem, rewardDescription } = body;

      if (!pointsToRedeem || pointsToRedeem <= 0) {
        return NextResponse.json({ error: 'Points to redeem must be greater than 0' }, { status: 400 });
      }

      // Get loyalty reward
      const { data: loyaltyReward, error: fetchError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .or(`user_id.eq.${userId || 'null'},customer_id.eq.${customerId || 'null'}`)
        .single();

      if (fetchError || !loyaltyReward) {
        return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
      }

      if (pointsToRedeem < 1250) {
        return NextResponse.json({ 
          error: 'Minimum redemption is 1250 points ($25.00)' 
        }, { status: 400 });
      }

      if (loyaltyReward.available_points < pointsToRedeem) {
        return NextResponse.json({ 
          error: `Insufficient points. You have ${loyaltyReward.available_points} available points.` 
        }, { status: 400 });
      }

      // Calculate reward value
      const rewardValue = pointsToRedeem * 0.02; // 1 point = $0.02 (2% back)

      // Update loyalty reward
      const { data: updatedReward, error: updateError } = await supabase
        .from('loyalty_rewards')
        .update({
          available_points: loyaltyReward.available_points - pointsToRedeem,
          redeemed_points: (loyaltyReward.redeemed_points || 0) + pointsToRedeem,
          available_reward_balance: (loyaltyReward.available_reward_balance || 0) + rewardValue,
          total_rewards_redeemed: (loyaltyReward.total_rewards_redeemed || 0) + rewardValue
        })
        .eq('id', loyaltyReward.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          user_id: userId,
          loyalty_reward_id: loyaltyReward.id,
          transaction_type: 'redeemed',
          points: -pointsToRedeem,
          point_value: rewardValue,
          description: rewardDescription || `Redeemed ${pointsToRedeem} points ($${rewardValue.toFixed(2)} credit)`,
          status: 'active'
        }]);

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      return NextResponse.json({
        success: true,
        reward: updatedReward,
        rewardValue: rewardValue,
        message: `Successfully redeemed ${pointsToRedeem} points for $${rewardValue.toFixed(2)} credit`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in loyalty API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process loyalty action' },
      { status: 500 }
    );
  }
}

// PUT - Update loyalty reward (admin)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { rewardId, points, tier, notes } = body;

    const updates = {};
    if (points !== undefined) updates.total_points = points;
    if (tier) updates.loyalty_tier = tier;
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('loyalty_rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, reward: data });
  } catch (error) {
    console.error('Error updating loyalty reward:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update loyalty reward' },
      { status: 500 }
    );
  }
}

