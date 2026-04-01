import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, phone, city, source, preferences } = body

    // Validate required fields
    if (!name || !email) {
      return Response.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('email_subscribers')
      .select('id, preferences')
      .eq('email', email)
      .single()

    if (existingSubscriber) {
      // Update existing subscriber's preferences
      const { data, error } = await supabase
        .from('email_subscribers')
        .update({
          name,
          phone,
          city,
          preferences,
          updated_at: new Date().toISOString(),
          is_active: true,
          unsubscribed_at: null
        })
        .eq('email', email)
        .select()

      if (error) {
        console.error('Error updating subscriber:', error)
        return Response.json(
          { error: 'Failed to update email preferences' },
          { status: 500 }
        )
      }

      return Response.json({
        success: true,
        message: 'Email preferences updated successfully',
        subscriber: data[0]
      })
    } else {
      // Create new subscriber
      const { data, error } = await supabase
        .from('email_subscribers')
        .insert({
          name,
          email,
          phone,
          city,
          source: source || 'contact_form',
          preferences,
          subscribed_at: new Date().toISOString(),
          is_active: true
        })
        .select()

      if (error) {
        console.error('Error creating subscriber:', error)
        return Response.json(
          { error: 'Failed to save email preferences' },
          { status: 500 }
        )
      }

      return Response.json({
        success: true,
        message: 'Successfully subscribed to email list',
        subscriber: data[0]
      })
    }
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      // Get specific subscriber
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        return Response.json({ error: 'Database error' }, { status: 500 })
      }

      return Response.json({ subscriber: data || null })
    } else {
      // Get all subscribers (admin only)
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false })

      if (error) {
        return Response.json({ error: 'Database error' }, { status: 500 })
      }

      return Response.json({ subscribers: data })
    }
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Soft delete - mark as unsubscribed
    const { data, error } = await supabase
      .from('email_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()

    if (error) {
      return Response.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Successfully unsubscribed from email list'
    })
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 