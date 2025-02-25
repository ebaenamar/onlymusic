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
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
MONGODB_URI=your_mongodb_uri
```

3. Run the application:
```bash
python app.py
```

## Technology Stack
- Backend: Python/Flask
- Frontend: React
- Database: MongoDB
- APIs: Spotify Web API
- AI: DeepFace for facial similarity
- Music Analysis: Spotify API features
