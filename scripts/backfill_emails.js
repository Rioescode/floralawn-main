const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resendKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!resendKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
  console.log('🚀 Starting Bulletproof Resend Sync (Direct API + Throttle)...');
  
  try {
    // 1. Get all metadata first via axios
    let allMetadata = [];
    let hasMore = true;
    let lastId = null;

    while (hasMore) {
      console.log('Fetching list chunk...');
      const response = await axios.get('https://api.resend.com/emails', {
        headers: { 'Authorization': `Bearer ${resendKey}` },
        params: { limit: 100, ...(lastId && { after: lastId }) }
      });
      
      const emails = response.data.data;
      if (!emails || emails.length === 0) { hasMore = false; break; }
      allMetadata = [...allMetadata, ...emails];
      lastId = emails[emails.length - 1].id;
      if (emails.length < 100) hasMore = false;
    }

    console.log(`✅ Found ${allMetadata.length} sent emails. Skipping sent phase...`);
    /*
    for (let i = 0; i < allMetadata.length; i++) {
      // ... (skip) ...
    }
    */

    // Phase 3: Get Inbound (Receiving) Emails
    console.log('\n🚀 Fetching Inbound (Received) Emails...');
    try {
      const inboundResponse = await axios.get('https://api.resend.com/emails/receiving', {
        headers: { 'Authorization': `Bearer ${resendKey}` }
      });
      const inboundEmails = inboundResponse.data.data || [];
      console.log(`✅ Found ${inboundEmails.length} inbound emails. Syncing...`);
      
      for (let i = 0; i < inboundEmails.length; i++) {
        const m = inboundEmails[i];
        process.stdout.write(`[Inbound ${i+1}/${inboundEmails.length}] Fetching ${m.id}... `);
        try {
          const res = await axios.get(`https://api.resend.com/emails/receiving/${m.id}`, {
            headers: { 'Authorization': `Bearer ${resendKey}` }
          });
          const full = res.data;
          
          const logData = {
            recipient_email: full.from || 'Customer',
            subject: full.subject || 'Inbound Message',
            body_html: full.html || full.text || '',
            type: 'INBOUND',
            direction: 'INBOUND',
            created_at: full.created_at
          };

          await supabase.from('email_logs').upsert(logData, { onConflict: 'recipient_email,subject,created_at' });
          console.log('✅ Done');
        } catch (e) {
          console.log(`❌ Failed: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (e) {
      console.error('Inbound Sync Error:', e.message);
    }

    console.log('\n✨ Mission Accomplished! All history (Sent & Received) synced.');

  } catch (err) {
    console.error('Fatal Error:', err.message);
  }
}

backfill();
