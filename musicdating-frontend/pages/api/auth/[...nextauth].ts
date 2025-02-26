import NextAuth, { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '../../../lib/mongodb'
import { JWT } from 'next-auth/jwt'

// Extend the JWT type to include our custom properties
interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

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
  debug: process.env.NODE_ENV === 'development',
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
            image: '/musicmatch-logo-fun.svg'
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
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }): Promise<ExtendedJWT> {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        }
      }

      // Return previous token if the access token has not expired yet
      const typedToken = token as ExtendedJWT;
      if (typedToken.accessTokenExpires && Date.now() < typedToken.accessTokenExpires) {
        return typedToken;
      }

      // Access token has expired, try to update it
      return typedToken;
    },
    async session({ session, token }) {
      const typedToken = token as ExtendedJWT;
      if (typedToken) {
        session.accessToken = typedToken.accessToken || '';
        session.user = typedToken.user || session.user;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Always allow demo account
      if (account?.provider === 'demo-login') {
        return true
      }
      
      // For Spotify, check email
      if (account?.provider === 'spotify') {
        if (!profile?.email) {
          return '/auth/error?error=NoEmailProvided'
        }
        
        // We'll still return true here even if there are issues with Spotify
        // The user can always use the demo account from the error page
        return true
      }
      
      return true
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'a-default-secret-for-development-only',
  // Optimized for Vercel deployment
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}

export default NextAuth(authOptions)
