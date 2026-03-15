import { createClient } from 'npm:@supabase/supabase-js@2'
import { render } from 'npm:@react-email/render@0.0.12'
import { AdminTicketNotification } from '../_shared/email-templates/admin-ticket-notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      customerName,
      customerEmail,
      vendorName,
      issueType,
      description,
      ticketRef,
    } = await req.json()

    if (!customerName || !customerEmail || !vendorName || !issueType || !description || !ticketRef) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all admin emails
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (rolesError || !adminRoles?.length) {
      console.error('Failed to fetch admin roles', rolesError)
      return new Response(
        JSON.stringify({ error: 'No admins found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminUserIds = adminRoles.map((r) => r.user_id)

    const { data: adminProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds)
      .not('email', 'is', null)

    if (profilesError || !adminProfiles?.length) {
      console.error('Failed to fetch admin emails', profilesError)
      return new Response(
        JSON.stringify({ error: 'No admin emails found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const submittedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const html = render(
      AdminTicketNotification({
        customerName,
        customerEmail,
        vendorName,
        issueType,
        description: description.substring(0, 500),
        ticketRef,
        submittedAt,
      })
    )

    // Enqueue one email per admin
    let enqueued = 0
    for (const profile of adminProfiles) {
      if (!profile.email) continue

      const messageId = `admin-ticket-notify-${ticketRef}-${profile.email}`

      const { error: enqueueError } = await supabase.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          to: profile.email,
          subject: `New Support Request: ${issueType} — ${vendorName}`,
          html,
          message_id: messageId,
          template_name: 'admin-ticket-notification',
        },
      })

      if (enqueueError) {
        console.error('Failed to enqueue email', { email: profile.email, error: enqueueError })
      } else {
        // Log to email_send_log
        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'admin-ticket-notification',
          recipient_email: profile.email,
          status: 'pending',
          metadata: { ticketRef, customerName, vendorName, issueType },
        })
        enqueued++
      }
    }

    return new Response(
      JSON.stringify({ success: true, enqueued }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-transactional-email error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
