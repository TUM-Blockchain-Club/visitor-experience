import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
// (no-op) removed unused firebase-admin app imports
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { createTransport } from "nodemailer"
import { JWT } from "google-auth-library"
import { createCertCredential } from "@/lib/firebase/admin"
import { adminDb } from "@/lib/firebase/admin"
import { v4 as uuidv4 } from "uuid"

const text = ({ url, host }: { url: string; host: string }) => {
  return `Sign in to ${host}\n${url}\n\n`
}

const html = ({ url, host }: { url: string; host: string }) => {
  const accent = "#7C3AED" // purple tint
  const accentLight = "#F5F3FF"
  const textColor = "#0F172A"
  const mutedColor = "#475569"
  const borderColor = "#E2E8F0"

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign in to ${host}</title>
    <style>
      /* Clients that ignore inlined styles will still get decent defaults */
      body { margin:0; padding:0; background:${accentLight}; color:${textColor}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      a { color:${accent}; text-decoration:none; }
    </style>
  </head>
  <body style="margin:0; padding:24px; background:${accentLight}; color:${textColor};">
    <!-- Preheader text -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Your secure sign-in link for ${host}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; background:#FFFFFF; border-radius:12px; border:1px solid ${borderColor}; overflow:hidden;">
            <tr>
              <td style="height:4px; background:${accent};"></td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px 24px;">
                <h1 style="margin:0 0 8px 0; font-size:20px; line-height:1.4; font-weight:700; color:${textColor};">Sign in to ${host}</h1>
                <p style="margin:0; font-size:14px; line-height:1.7; color:${mutedColor};">Your magic link is ready. For your security, this link can only be used once and will expire shortly.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <a href="${url}"
                   style="display:inline-block; background:${accent}; color:#FFFFFF; font-weight:600; font-size:14px; line-height:1; padding:12px 18px; border-radius:999px; text-decoration:none;">
                  Continue to ${host}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 20px 24px;">
                <p style="margin:0; font-size:12px; line-height:1.7; color:${mutedColor};">
                  If the button doesn't work, copy and paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0 0; word-break:break-all; font-size:12px; line-height:1.6;">
                  <a href="${url}" style="color:${accent}; text-decoration:underline;">${url}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px 24px; border-top:1px solid ${borderColor};">
                <p style="margin:0; font-size:12px; line-height:1.7; color:${mutedColor};">
                  Didn’t request this email? You can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
          <div style="padding:16px; font-size:12px; color:${mutedColor};">
            © ${new Date().getFullYear()} TUM Blockchain Club e.V.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Nodemailer({
        server: "smtp.gmail.com",
        sendVerificationRequest: async (params) => {
          const sendAs = process.env.EMAIL_FROM!

          const jwt = new JWT({
            email: process.env.FIREBASE_CLIENT_EMAIL,
            key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            scopes: ["https://mail.google.com/"],
            subject: sendAs,
          })

          const { access_token } = await jwt.authorize()
          if (!access_token) throw new Error("Failed to mint access token via DWD");
          
          const { identifier, url } = params
          const { host } = new URL(url)

          const transport = createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { 
              type: "OAuth2", 
              user: sendAs, 
              accessToken: access_token as string, 
            },
          });

          const result = await transport.sendMail({
            to: identifier,
            from: `Visitor Experience @ TUM Blockchain Conference 2025 <${sendAs}>`,
            subject: `Sign in to ${host}`,
            text: text({ url, host }),
            html: html({ url, host }),
          })

          const rejected = result.rejected || []
          const pending = result.pending || []
          const failed = rejected.concat(pending).filter(Boolean)
          if (failed.length) {
            throw new Error(`Email (${failed.join(", ")}) could not be sent`)
          }
        }
    }),
  ],
  adapter: FirestoreAdapter({
    credential: createCertCredential(),
  }),
  pages: {
    signIn: "/",
    verifyRequest: "/verify",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user?.id) {
        // Expose user.id to session for server-side authorization (database strategy)
        ;(session.user as typeof session.user & { id?: string }).id = user.id
      }
      return session
    },
  },
  events: {
    // Run once when Auth.js creates a new user record
    async createUser({ user }) {
      try {
        const ownerUserId = user.id
        if (!ownerUserId) return

        // If a calendar already exists for this user, bail
        const existing = await adminDb
          .collection('user_selections')
          .where('ownerUserId', '==', ownerUserId)
          .limit(1)
          .get()

        if (!existing.empty) {
          console.log('Calendar already exists for user', ownerUserId)
          return
        }

        const calendarId = uuidv4()
        console.log('Creating calendar for user', ownerUserId, 'with id', calendarId)
        await adminDb.collection('user_selections').doc(calendarId).set({
          calendarId,
          ownerUserId,
          selectedEventIds: [],
        })
      } catch (error) {
        console.error('Auth.js createUser event failed to create calendar', error)
      }
    },
  },
})