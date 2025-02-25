import NextAuth, { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '../../../lib/mongodb'

const scope = [
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-private',
  'user-library-read',
  'user-read-currently-playing',
  'user-read-recently-played',
].join(' ')

export const authOptions: NextAuthOptions = {
  debug: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at! * 1000
      }
      return token
    },
    async session({ session, token, user }) {
      session.accessToken = token.accessToken as string
      session.user.id = user.id
      return session
    },
    async signIn({ user, account, profile }) {
      if (!profile?.email) {
        return false
      }
      return true
    }
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)
