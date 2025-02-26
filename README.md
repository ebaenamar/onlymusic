# Compatible Vibes (MusicMatch)

A modern connection platform that matches users based on musical compatibility using Spotify playlists.

## Features
- User authentication with Spotify OAuth
- Demo account for easy access
- Share your defining playlists
- AI-powered matching based on music taste compatibility
- Browse potential matches and their playlists
- Real-time chat with matches

## Setup
1. Install dependencies:
```bash
cd musicdating-frontend
npm install
```

2. Set up environment variables in `.env.local`:
```
# Spotify Authentication
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# MongoDB (optional)
MONGODB_URI=your_mongodb_uri

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

3. Run the development server:
```bash
npm run dev
```

## Authentication Setup

### Demo Account
The app includes a built-in demo account for easy testing:
- Username: `demo`
- Password: `demo123`

### Spotify OAuth
To set up Spotify authentication:

1. Create a Spotify Developer account at [developer.spotify.com](https://developer.spotify.com/)
2. Create a new application in the Spotify Developer Dashboard
3. Add the following redirect URIs:
   - `http://localhost:3000/api/auth/callback/spotify` (for local development)
   - `https://your-vercel-domain.vercel.app/api/auth/callback/spotify` (for production)
4. Copy your Client ID and Client Secret to your environment variables

## Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in the Vercel project settings:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `MONGODB_URI` (optional)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Note: You do not need to set `NEXTAUTH_URL` on Vercel as it's automatically handled

4. Deploy!

### Troubleshooting Vercel Deployment

If you encounter authentication issues on Vercel:

1. **Redirect URI Issues**: Make sure your Spotify app has the correct redirect URI: `https://your-vercel-domain.vercel.app/api/auth/callback/spotify`

2. **MongoDB Access**: If using MongoDB, ensure your database allows connections from Vercel's IP addresses (you may need to allow access from `0.0.0.0/0` in MongoDB Atlas)

3. **Environment Variables**: Verify all environment variables are correctly set in Vercel's project settings

4. **Demo Account**: The demo account will always work regardless of Spotify configuration issues

## Technology Stack
- Frontend: Next.js, TypeScript, Chakra UI
- Database: MongoDB (optional, falls back to JWT)
- Authentication: NextAuth.js with Spotify OAuth and demo credentials
- APIs: Spotify Web API
- Deployment: Vercel-optimized configuration
