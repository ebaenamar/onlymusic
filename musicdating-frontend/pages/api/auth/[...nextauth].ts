import NextAuth, { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import CredentialsProvider from 'next-auth/providers/credentials'
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

// Determine if we should use MongoDB adapter
let adapter;
try {
  adapter = MongoDBAdapter(clientPromise);
} catch (error) {
  console.warn('MongoDB adapter initialization failed, falling back to JWT only');
  adapter = undefined;
}

export const authOptions: NextAuthOptions = {
  debug: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  adapter,
  providers: [
    // Put CredentialsProvider first to prioritize it
    CredentialsProvider({
      id: "demo-login",
      name: 'Demo Account',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "demo" },
        password: { label: "Password", type: "password", placeholder: "demo123" }
      },
      async authorize(credentials) {
        // This is a demo account for testing purposes
        if (credentials?.username === 'demo' && credentials?.password === 'demo123') {
          return {
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@musicmatch.example',
            image: '/musicmatch-logo-v3.svg'
          }
        }
        return null
      }
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'dummy-client-secret',
      authorization: {
        params: { scope }
      },
      // Handle INVALID_CLIENT error
      async authorize(params, context) {
        try {
          return await context.authorize(params, context)
        } catch (error) {
          if (error.code === 'INVALID_CLIENT') {
            console.error('Spotify authorization failed due to invalid client')
            return null
          }
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined
      }
      return token
    },
    async session({ session, token, user }) {
      session.accessToken = token.accessToken as string || ''
      if (user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Always allow demo account
      if (account?.provider === 'demo-login') {
        return true
      }
      
      // For Spotify, check email
      if (account?.provider === 'spotify' && !profile?.email) {
        return false
      }
      return true
    }
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'a-default-secret-for-development-only'
}

export default NextAuth(authOptions)
