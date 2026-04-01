import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch sent invitations for a user or all (admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const referralCode = searchParams.get('referralCode');
    const all = searchParams.get('all');

    const client = supabaseAdmin || supabase;

    let query = client
      .from('referral_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    // If all=true, fetch all invitations (admin only)
    if (all === 'true') {
      query = query.limit(500);
    } else if (referralCode) {
      query = query.eq('referral_code', referralCode);
    } else if (userId) {
      query = query.eq('referrer_id', userId);
    } else if (customerId) {
      query = query.eq('referrer_customer_id', customerId);
    } else {
      return NextResponse.json({ invitations: [] });
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error in GET invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { friendEmail, friendName, referralCode, referralLink, userId, customerId } = body;

    if (!friendEmail || !referralCode) {
      return NextResponse.json(
        { error: 'Friend email and referral code are required' },
        { status: 400 }
      );
    }

    // Use admin client for database operations
    const client = supabaseAdmin || supabase;

    // Get referrer info
    let referrerName = 'A friend';
    let referrerEmail = null;
    
    if (userId) {
      const { data: profile } = await client
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      
      if (profile?.full_name) {
        referrerName = profile.full_name;
      } else if (profile?.email) {
        referrerName = profile.email.split('@')[0];
      }
      referrerEmail = profile?.email;
    }

    if (customerId) {
      const { data: customer } = await client
        .from('customers')
        .select('name, email')
        .eq('id', customerId)
        .single();
      
      if (customer?.name) {
        referrerName = customer.name;
      }
      if (customer?.email) {
        referrerEmail = customer.email;
      }
    }

    // Check if already invited this email
    const { data: existingInvite } = await client
      .from('referral_invitations')
      .select('id, status, created_at')
      .eq('referral_code', referralCode)
      .eq('friend_email', friendEmail.toLowerCase().trim())
      .maybeSingle();

    if (existingInvite) {
      // Allow re-sending if invited more than 7 days ago
      const daysSinceInvite = (Date.now() - new Date(existingInvite.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceInvite < 7) {
        return NextResponse.json(
          { error: 'You already invited this person recently. You can resend after 7 days.' },
          { status: 400 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com';
    const contactLink = `${baseUrl}/contact?ref=${referralCode}`;
    
    const greeting = friendName ? `Hi ${friendName}` : 'Hi there';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #22C55E; margin-bottom: 10px;">🌿 Flora Lawn & Landscaping</h1>
          <p style="color: #666; font-size: 14px;">Professional Lawn Care Services</p>
        </div>

        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px;">${greeting}! 👋</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
            <strong style="color: #166534;">${referrerName}</strong> thinks you'd love Flora Lawn & Landscaping and wanted to share a special referral with you!
          </p>
        </div>

        <div style="background: #fff; border: 2px solid #22C55E; border-radius: 16px; padding: 25px; margin-bottom: 25px; text-align: center;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Referral Code:</p>
          <div style="background: #f0fdf4; padding: 15px 25px; border-radius: 10px; display: inline-block; margin-bottom: 15px;">
            <span style="font-family: monospace; font-size: 28px; font-weight: bold; color: #166534; letter-spacing: 2px;">${referralCode}</span>
          </div>
          <p style="color: #374151; font-size: 14px; margin: 0;">
            This code will be <strong>automatically applied</strong> when you click the button below! 🎁
          </p>
        </div>

        <!-- How to Get Your Reward -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📋 How to Get Your Reward</h3>
          <div style="color: #1e3a8a;">
            <div style="display: flex; margin-bottom: 12px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</div>
              <div style="font-size: 14px; line-height: 1.5;">
                <strong>Click the button below</strong> - The referral code will be automatically filled in the form!
              </div>
            </div>
            <div style="display: flex; margin-bottom: 12px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</div>
              <div style="font-size: 14px; line-height: 1.5;">
                <strong>Fill out your info</strong> - Tell us about your lawn care needs
              </div>
            </div>
            <div style="display: flex; margin-bottom: 12px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</div>
              <div style="font-size: 14px; line-height: 1.5;">
                <strong>Create an account (optional)</strong> - Sign up with Google for easy access to your dashboard & to track your referral rewards
              </div>
            </div>
            <div style="display: flex;">
              <div style="background: #22c55e; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">✓</div>
              <div style="font-size: 14px; line-height: 1.5;">
                <strong>Get rewarded!</strong> - After your first service, both you and ${referrerName} earn service credits!
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${contactLink}" style="display: inline-block; background: #22C55E; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 18px; font-weight: bold;">
            Get Your Free Quote →
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">
            Click above - referral code auto-fills! ✨
          </p>
        </div>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">✨ Why Choose Flora Lawn?</h3>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Professional lawn mowing & landscaping</li>
            <li>Reliable weekly, bi-weekly, or monthly service</li>
            <li>Serving Rhode Island communities</li>
            <li>Free estimates with no obligation</li>
          </ul>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🎁 Referral Rewards</h3>
          <p style="color: #78350f; font-size: 14px; margin: 0;">
            When you complete your first service, you'll both receive service credits as a thank you! The more referrals, the bigger the rewards (up to $100 per referral)!
          </p>
        </div>

        <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
            Flora Lawn and Landscaping Inc<br>
            45 Vernon Street, Pawtucket, RI 02860<br>
            📞 (401) 389-0913
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            You received this email because ${referrerName} thought you'd be interested in our services.
          </p>
        </div>
      </div>
    `;

    const emailText = `
${greeting}!

${referrerName} thinks you'd love Flora Lawn & Landscaping and wanted to share a special referral with you!

Your Referral Code: ${referralCode}

This code will be AUTOMATICALLY APPLIED when you click the link below!

📋 HOW TO GET YOUR REWARD:

1. Click the link below - The referral code will be automatically filled in!
2. Fill out your info - Tell us about your lawn care needs
3. Create an account (optional) - Sign up with Google for easy dashboard access & to track rewards
✓ Get rewarded! - After your first service, both you and ${referrerName} earn service credits!

Get your free quote here: ${contactLink}

Why Choose Flora Lawn?
- Professional lawn mowing & landscaping
- Reliable weekly, bi-weekly, or monthly service
- Serving Rhode Island communities
- Free estimates with no obligation

🎁 Referral Rewards: When you complete your first service, you'll both receive service credits! The more referrals, the bigger the rewards (up to $100 per referral)!

---
Flora Lawn and Landscaping Inc
45 Vernon Street, Pawtucket, RI 02860
Phone: (401) 389-0913
    `;

    // Send the email
    const result = await sendEmail({
      to: friendEmail,
      subject: `${referrerName} invited you to Flora Lawn & Landscaping! 🌿`,
      text: emailText,
      html: emailHtml,
      replyTo: 'floralawncareri@gmail.com'
    });

    console.log('Referral invite email sent:', result);

    // Save the invitation to database
    const invitationData = {
      referrer_id: userId || null,
      referrer_customer_id: customerId || null,
      referrer_email: referrerEmail,
      referrer_name: referrerName,
      friend_email: friendEmail.toLowerCase().trim(),
      friend_name: friendName?.trim() || null,
      referral_code: referralCode,
      status: 'invited'
    };

    if (existingInvite) {
      // Update existing invitation (re-send)
      await client
        .from('referral_invitations')
        .update({ 
          updated_at: new Date().toISOString(),
          referrer_name: referrerName 
        })
        .eq('id', existingInvite.id);
    } else {
      // Create new invitation
      const { error: insertError } = await client
        .from('referral_invitations')
        .insert([invitationData]);

      if (insertError) {
        console.error('Error saving invitation:', insertError);
        // Don't fail the request, email was sent
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      emailId: result?.id
    });

  } catch (error) {
    console.error('Error sending referral invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

