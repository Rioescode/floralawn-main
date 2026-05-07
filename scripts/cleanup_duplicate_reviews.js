const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateReviews() {
  console.log('Scanning for duplicate review emails...\n');

  // Find all "Checking in" review emails
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('*')
    .ilike('subject', '%checking in on your property%')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log(`Found ${logs.length} total review emails.\n`);

  // Group by recipient email
  const grouped = {};
  for (const log of logs) {
    if (!grouped[log.recipient_email]) {
      grouped[log.recipient_email] = [];
    }
    grouped[log.recipient_email].push(log);
  }

  let totalDeleted = 0;

  for (const [email, entries] of Object.entries(grouped)) {
    if (entries.length <= 1) continue;

    console.log(`${email}: ${entries.length} emails (keeping 1, deleting ${entries.length - 1})`);

    // Keep the first one, delete the rest
    const idsToDelete = entries.slice(1).map(e => e.id);

    const { error: delError } = await supabase
      .from('email_logs')
      .delete()
      .in('id', idsToDelete);

    if (delError) {
      console.error(`  Error deleting for ${email}:`, delError);
    } else {
      totalDeleted += idsToDelete.length;
      console.log(`  ✓ Deleted ${idsToDelete.length} duplicates`);
    }

    // Update the remaining one to have type = 'REVIEW'
    const { error: updateError } = await supabase
      .from('email_logs')
      .update({ type: 'REVIEW' })
      .eq('id', entries[0].id);

    if (!updateError) {
      console.log(`  ✓ Updated remaining log to type=REVIEW`);
    }
  }

  console.log(`\nDone! Cleaned up ${totalDeleted} duplicate entries.`);
}

cleanupDuplicateReviews();
