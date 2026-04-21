import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
          access_type: 'online',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      console.log('[NextAuth JWT] called with account:', !!account)
      if (account?.access_token) {
        console.log('[NextAuth JWT] setting accessToken')
        token.accessToken = account.access_token
      }
      if (account?.providerAccountId) {
        console.log('[NextAuth JWT] setting sub from providerId:', account.providerAccountId)
        token.sub = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      console.log('[NextAuth Session] called')
      session.accessToken = token.accessToken
      if (token.sub) {
        console.log('[NextAuth Session] setting user.id:', token.sub)
        session.user.id = token.sub
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback - input url:', url)
      const finalUrl = baseUrl + '/dashboard'
      console.log('[NextAuth] Redirect callback - returning:', finalUrl)
      return finalUrl
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 55 * 60,   // 55 min — matches Google access token lifetime
  },
}
