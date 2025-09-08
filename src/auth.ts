import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { cert, initializeApp } from "firebase-admin/app"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { createTransport } from "nodemailer"
import { JWT } from "google-auth-library"
import { createCertCredential } from "@/lib/firebase/admin"

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
})