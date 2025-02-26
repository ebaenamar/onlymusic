import NextAuth, { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '../../../lib/mongodb'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'

// Extend the JWT type to include our custom properties
interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// Extend the Session type
interface ExtendedSession extends Session {
  accessToken: string;
  error?: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
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

// Function to refresh Spotify access token
async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const url = 'https://accounts.spotify.com/api/token';
    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID || '',
      client_secret: process.env.SPOTIFY_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    });

    console.log(`Refreshing access token for user ${token.user?.name || 'unknown'}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Error refreshing access token', refreshedTokens);
      throw new Error("Failed to refresh access token");
    }

    console.log('Token refreshed successfully');

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Fall back to old refresh token if a new one isn't provided
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// Determine if we should use MongoDB adapter
let adapter;
try {
  adapter = MongoDBAdapter(clientPromise);
} catch (error) {
  console.warn('MongoDB adapter initialization failed, falling back to JWT only');
  adapter = undefined;
}

// Determine if we're in a Vercel environment
const isVercelProduction = process.env.VERCEL_URL && process.env.NODE_ENV === 'production';
const isVercelPreview = process.env.VERCEL_URL && process.env.VERCEL_ENV === 'preview';

export const authOptions: NextAuthOptions = {
  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
  
  // Custom logger for errors and debugging
  logger: {
    error(code, metadata) {
      console.error(`Auth error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`Auth warning: ${code}`);
    },
    debug(code, metadata) {
      console.debug(`Auth debug: ${code}`, metadata);
    }
  },
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
        console.log(`New sign-in for user: ${user.name || 'unknown'}, provider: ${account.provider}`);
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
      console.log(`Access token expired for user ${typedToken.user?.name || 'unknown'}, attempting refresh`);
      
      // Only attempt to refresh if we have a refresh token and it's a Spotify account
      if (typedToken.refreshToken && typedToken.user?.id !== 'demo-user') {
        return refreshAccessToken(typedToken);
      }
      
      // For demo user or if no refresh token, just return the token as is
      return typedToken;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      const typedToken = token as ExtendedJWT;
      const typedSession = session as ExtendedSession;
      
      // Add access token to session
      typedSession.accessToken = typedToken.accessToken || '';
      
      // Pass any error to the client
      if (typedToken.error) {
        typedSession.error = typedToken.error;
      }
      
      // Only update user properties if they exist in the token
      if (typedToken.user) {
        typedSession.user.id = typedToken.user.id || 'unknown-user';
        
        // Only assign non-null values for optional properties
        if (typedToken.user.name) typedSession.user.name = typedToken.user.name;
        if (typedToken.user.email) typedSession.user.email = typedToken.user.email;
        if (typedToken.user.image) typedSession.user.image = typedToken.user.image;
      } else {
        // Fallback if user object is missing in token
        typedSession.user.id = 'unknown-user';
      }
      
      return typedSession;
    },
    async signIn({ user, account, profile }) {
      // Always allow demo account
      if (account?.provider === 'demo-login') {
        console.log('Demo account login successful');
        return true
      }
      
      // For Spotify, perform additional checks
      if (account?.provider === 'spotify') {
        // Log the authentication attempt
        console.log(`Spotify auth attempt for user: ${profile?.email || 'unknown email'}`);
        
        if (!profile?.email) {
          console.error('Spotify login failed: No email provided');
          return '/auth/error?error=NoEmailProvided'
        }
        
        // You could add additional checks here if needed
        // For example, email domain verification, etc.
        
        console.log(`Spotify login successful for: ${profile.email}`);
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
  useSecureCookies: isVercelProduction || process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${isVercelProduction || process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isVercelProduction || process.env.NODE_ENV === 'production'
      }
    }
  },
  // Better logging for NextAuth events
  events: {
    async signIn(message) { 
      console.log(`User signed in: ${message.user.email || 'unknown'}`);
    },
    async signOut(message) { 
      console.log(`User signed out: ${message.token.email || 'unknown'}`);
    }
  }
}

export default NextAuth(authOptions)
