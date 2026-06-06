import { APP_URL } from './resend'

// ── Shared layout wrapper ──────────────────────────────────────────────────

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background: #1e40af; padding: 24px 32px; }
    .header h1 { color: white; margin: 0; font-size: 18px; font-weight: 600; }
    .body { padding: 32px; }
    .body p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .card p { margin: 0 0 4px; color: #6b7280; font-size: 13px; }
    .card strong { color: #111827; font-size: 15px; }
    .btn { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    .chip { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; margin: 2px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Thrive Scholars</h1></div>
    <div class="body">${body}</div>
    <div class="footer"><p>Thrive Scholars Mentorship Platform · Questions? Reply to this email.</p></div>
  </div>
</body>
</html>`
}

// ── Email 1: Match approved — sent to BOTH scholar and volunteer ───────────

export function matchApprovedScholar(data: {
  scholarFirstName: string
  volunteerName: string
  volunteerTitle: string
  volunteerEmployer: string
  programName: string
  pmNotes?: string
}): { subject: string; html: string } {
  return {
    subject: `You've been matched! Meet ${data.volunteerName}`,
    html: layout(`
      <p>Hi ${data.scholarFirstName},</p>
      <p>Great news — your program manager has matched you with a volunteer for <strong>${data.programName}</strong>.</p>
      <div class="card">
        <p>Your match</p>
        <strong>${data.volunteerName}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">${data.volunteerTitle} · ${data.volunteerEmployer}</span>
      </div>
      ${data.pmNotes ? `<p style="font-style:italic;color:#6b7280;">"${data.pmNotes}"</p>` : ''}
      <p>Please log in to accept or decline this match.</p>
      <a href="${APP_URL}/scholar/matches" class="btn">View your match →</a>
      <p style="margin-top:20px;color:#6b7280;font-size:13px;">This match will expire if no response is received within the next few days.</p>
    `),
  }
}

export function matchApprovedVolunteer(data: {
  volunteerFirstName: string
  scholarName: string
  scholarStage: string
  scholarCollege: string
  careerInterests: string[]
  programName: string
  pmNotes?: string
}): { subject: string; html: string } {
  return {
    subject: `New match request — ${data.scholarName}`,
    html: layout(`
      <p>Hi ${data.volunteerFirstName},</p>
      <p>You've been matched with a Thrive Scholar for <strong>${data.programName}</strong>.</p>
      <div class="card">
        <p>Your scholar</p>
        <strong>${data.scholarName}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">${data.scholarStage} · ${data.scholarCollege}</span>
        ${data.careerInterests.length > 0 ? `
        <div style="margin-top:10px;">
          ${data.careerInterests.map(ci => `<span class="chip">${ci}</span>`).join('')}
        </div>` : ''}
      </div>
      ${data.pmNotes ? `<p style="font-style:italic;color:#6b7280;">"${data.pmNotes}"</p>` : ''}
      <p>Please log in to accept or decline this match.</p>
      <a href="${APP_URL}/volunteer/matches" class="btn">View your match →</a>
    `),
  }
}

// ── Email 2: Match active — both parties accepted ─────────────────────────

export function matchActiveScholar(data: {
  scholarFirstName: string
  volunteerName: string
  volunteerTitle: string
  volunteerEmployer: string
  programName: string
  calBookingUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `Your match is active — schedule your first session`,
    html: layout(`
      <p>Hi ${data.scholarFirstName},</p>
      <p>Your match with <strong>${data.volunteerName}</strong> is now active for <strong>${data.programName}</strong>. Both you and your volunteer have accepted — it's time to connect!</p>
      <div class="card">
        <p>Your mentor</p>
        <strong>${data.volunteerName}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">${data.volunteerTitle} · ${data.volunteerEmployer}</span>
      </div>
      ${data.calBookingUrl ? `
      <p>Book your first session directly on your mentor's calendar:</p>
      <a href="${data.calBookingUrl}" class="btn">Book a session →</a>
      ` : `<p>Your program manager will be in touch with next steps.</p>`}
    `),
  }
}

export function matchActiveVolunteer(data: {
  volunteerFirstName: string
  scholarName: string
  scholarStage: string
  programName: string
  calBookingUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `Your match is active — ${data.scholarName} is ready to connect`,
    html: layout(`
      <p>Hi ${data.volunteerFirstName},</p>
      <p>Your match with <strong>${data.scholarName}</strong> is now active for <strong>${data.programName}</strong>. Both parties have accepted.</p>
      <div class="card">
        <p>Your scholar</p>
        <strong>${data.scholarName}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">${data.scholarStage}</span>
      </div>
      ${data.calBookingUrl ? `
      <p>Share your booking link with your scholar so they can schedule a session:</p>
      <a href="${data.calBookingUrl}" class="btn">Your booking link →</a>
      ` : `<p>If you haven't already, add your Cal.com booking link to your profile so your scholar can schedule time with you.</p>`}
    `),
  }
}
