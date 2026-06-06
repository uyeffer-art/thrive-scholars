import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// In development use Resend's test address.
// In production swap this for your verified domain e.g. noreply@thrivescholars.org
export const FROM_ADDRESS = 'Thrive Scholars <onboarding@resend.dev>'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
