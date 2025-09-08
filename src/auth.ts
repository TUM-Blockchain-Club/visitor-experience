import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { cert, initializeApp } from "firebase-admin/app"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { createTransport } from "nodemailer"
import { JWT } from "google-auth-library"
import { createCertCredential } from "@/lib/firebase/admin"
import { adminDb } from "@/lib/firebase/admin"
import { v4 as uuidv4 } from "uuid"

const text = ({ url, host }: { url: string; host: string }) => {
  return `Sign in to ${host}\n${url}\n\n`
}

const html = ({url, host}: {url: string; host: string}) => {
  return `Sign in to ${host}\n${url}\n\n`
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

          const { access_token, expiry_date } = await jwt.authorize()
          if (!access_token) throw new Error("Failed to mint access token via DWD");
          console.log("token starts:", access_token.slice(0, 16), "exp:", expiry_date);

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
            from: sendAs,
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