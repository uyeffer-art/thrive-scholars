# Email Setup Guide (Production)

Right now the platform sends email two ways, both in "testing" mode:

| Email type | Sender | Current limitation |
|---|---|---|
| App emails (match notices, session reminders, confirmations) | **Resend** | Sandbox sender `onboarding@resend.dev` — only delivers to the Resend account owner's address |
| Auth emails (password reset, confirmation) | **Supabase** built-in mailer | Rate-limited on the free tier; not reliable for real users |

To send to real scholars and volunteers, do the two setups below. Total time ≈ 20–30 minutes plus DNS propagation.

---

## Step 1 — Verify a sending domain in Resend

You need DNS access to the domain you'll send from (e.g. `thrivescholars.org`,
or a subdomain like `mail.thrivescholars.org`). If the domain belongs to the
org, their IT/admin adds the records.

1. Go to **resend.com → Domains → Add Domain**. Enter the domain.
2. Resend shows a set of **DNS records** to add — typically:
   - An **SPF** record (TXT) — e.g. `v=spf1 include:amazonses.com ~all`
   - Three **DKIM** records (CNAME) — `resend._domainkey…` etc.
   - Optionally a **DMARC** record (TXT).
3. In your domain's DNS provider (GoDaddy, Cloudflare, Route 53, etc.), add
   each record exactly as shown.
4. Back in Resend, click **Verify**. Propagation can take minutes to a few hours.
5. Once it shows **Verified**, you can send from any address on that domain.

### Then update the app's "from" address
- File: `lib/email/resend.ts`
- Change `FROM_ADDRESS` from `onboarding@resend.dev` to your verified address,
  e.g. `Thrive Scholars <no-reply@thrivescholars.org>`.
- Commit + deploy (`vercel --prod`). That's the only code change needed —
  every email route already reads from this one constant.

---

## Step 2 — Point Supabase auth emails at Resend (SMTP)

This makes password-reset and confirmation emails reliable.

1. In **Resend → API Keys / SMTP**, get SMTP credentials:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: your Resend API key
2. In **Supabase → Authentication → Settings → SMTP Settings**, enable
   **Custom SMTP** and enter:
   - Sender email: your verified address (e.g. `no-reply@thrivescholars.org`)
   - Sender name: `Thrive Scholars`
   - Host / Port / Username / Password from step 1
3. Save. Supabase now sends all auth emails through your verified domain.

---

## Step 3 — Allowlist the reset redirect URL (required for password reset)

- **Supabase → Authentication → URL Configuration → Redirect URLs**
- Add: `https://thrive-scholars.vercel.app/reset-password`
- (Add the localhost equivalent too if you test locally.)

---

## Verification checklist
- [ ] Resend domain shows **Verified**
- [ ] `FROM_ADDRESS` updated + deployed
- [ ] Supabase custom SMTP saved
- [ ] Reset redirect URL allowlisted
- [ ] Test: trigger a session reminder to a real (non-test) address → it arrives
- [ ] Test: "Forgot password?" with a real address → reset email arrives + link works

> Note: the `@test.com` seed accounts will **never** receive email — Supabase
> rejects that domain as invalid. Always test with a real address.
