from flask import Flask, request, jsonify, session
from flask_cors import CORS
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from deepface import DeepFace
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.urandom(24)

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.musicdating

# Spotify API setup
sp_oauth = SpotifyOAuth(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri='http://localhost:5000/callback',
    scope='user-library-read playlist-read-private user-top-read'
)

def get_music_features(playlist_id):
    """Extract musical features from a playlist using Spotify API"""
    try:
        tracks = sp.playlist_tracks(playlist_id)
        features = []
        for track in tracks['items']:
            track_features = sp.audio_features(track['track']['id'])[0]
            if track_features:
                features.append([
                    track_features['danceability'],
                    track_features['energy'],
                    track_features['valence'],
                    track_features['tempo'],
                    track_features['acousticness']
                ])
        return np.mean(features, axis=0) if features else None
    except Exception as e:
        print(f"Error getting music features: {e}")
        return None

def calculate_match_score(user1_id, user2_id):
    """Calculate match score based on face similarity and music taste"""
    user1 = db.users.find_one({'_id': user1_id})
    user2 = db.users.find_one({'_id': user2_id})
    
    # Calculate face similarity
    try:
        face_similarity = DeepFace.verify(user1['photo_path'], user2['photo_path'])['distance']
        face_score = 1 - min(face_similarity, 1)  # Normalize to 0-1
    except:
        face_score = 0
    
    # Calculate music similarity
    music_score = cosine_similarity(
        [user1['music_features']], 
        [user2['music_features']]
    )[0][0]
    
    # Weighted average (60% physical, 40% music)
    return 0.6 * face_score + 0.4 * music_score

@app.route('/api/profile', methods=['POST'])
def create_profile():
    """Create or update user profile"""
    if 'photo' not in request.files or 'playlist_id' not in request.form:
        return jsonify({'error': 'Missing required fields'}), 400
    
    photo = request.files['photo']
    playlist_id = request.form['playlist_id']
    
    # Save photo
    photo_path = f"uploads/{photo.filename}"
    photo.save(photo_path)
    
    # Get music features
    music_features = get_music_features(playlist_id)
    
    if not music_features:
        return jsonify({'error': 'Could not analyze playlist'}), 400
    
    # Save user profile
    user_data = {
        'photo_path': photo_path,
        'playlist_id': playlist_id,
        'music_features': music_features.tolist()
    }
    
    user_id = db.users.insert_one(user_data).inserted_id
    return jsonify({'user_id': str(user_id)}), 201

@app.route('/api/matches/<user_id>', methods=['GET'])
def get_matches(user_id):
    """Get potential matches for a user"""
    user = db.users.find_one({'_id': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Find all other users
    potential_matches = []
    for other_user in db.users.find({'_id': {'$ne': user_id}}):
        match_score = calculate_match_score(user_id, other_user['_id'])
        if match_score > 0.5:  # Only include matches above 50% compatibility
            potential_matches.append({
                'user_id': str(other_user['_id']),
                'playlist_id': other_user['playlist_id'],
                'match_score': match_score
            })
    
    return jsonify(sorted(potential_matches, key=lambda x: x['match_score'], reverse=True))

if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True)
