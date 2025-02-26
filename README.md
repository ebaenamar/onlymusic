# MusicMatch Dating App

A modern dating application that matches users based on physical attraction and musical compatibility using Spotify playlists.

## Features
- User authentication with Spotify
- Upload and manage profile pictures
- Share your defining playlist
- AI-powered matching based on facial features and music taste
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

# MongoDB
MONGODB_URI=your_mongodb_uri

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

3. Run the development server:
```bash
npm run dev
```

## Deployment on Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in the Vercel project settings
4. Deploy!

## Technology Stack
- Frontend: Next.js, TypeScript, TensorFlow.js
- Database: MongoDB
- Authentication: NextAuth.js with Spotify provider
- APIs: Spotify Web API
- Music Analysis: Advanced audio feature analysis with TensorFlow.js
