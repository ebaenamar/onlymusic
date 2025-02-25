import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpotifyPlayer from 'react-spotify-web-playback';

const MatchingInterface = () => {
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('playlist_id', userProfile.playlistId);

    try {
      const response = await axios.post('/api/profile', formData);
      setUserProfile({ ...userProfile, userId: response.data.user_id });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handlePlaylistSelect = async (playlistId) => {
    if (!userProfile) {
      setUserProfile({ playlistId });
    }
  };

  const loadMatches = async () => {
    if (!userProfile?.userId) return;

    try {
      const response = await axios.get(`/api/matches/${userProfile.userId}`);
      setMatches(response.data);
      if (response.data.length > 0) {
        setCurrentMatch(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  useEffect(() => {
    if (userProfile?.userId) {
      loadMatches();
    }
  }, [userProfile?.userId]);

  return (
    <div className="matching-interface">
      {!userProfile ? (
        <div className="profile-setup">
          <h2>Set Up Your Profile</h2>
          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="photo-input"
            />
            <input
              type="text"
              placeholder="Enter your Spotify playlist ID"
              onChange={(e) => handlePlaylistSelect(e.target.value)}
              className="playlist-input"
            />
          </div>
        </div>
      ) : (
        <div className="matching-section">
          {currentMatch ? (
            <div className="match-card">
              <img
                src={`/api/photos/${currentMatch.user_id}`}
                alt="Potential match"
                className="match-photo"
              />
              <div className="match-info">
                <div className="match-score">
                  {Math.round(currentMatch.match_score * 100)}% Match
                </div>
                <SpotifyPlayer
                  token={userProfile.spotifyToken}
                  uris={[`spotify:playlist:${currentMatch.playlist_id}`]}
                  styles={{
                    bgColor: '#333',
                    color: '#fff',
                    loaderColor: '#fff',
                    sliderColor: '#1cb954',
                    savedColor: '#fff',
                    trackArtistColor: '#ccc',
                    trackNameColor: '#fff',
                  }}
                />
              </div>
              <div className="match-actions">
                <button onClick={() => setCurrentMatch(matches[matches.indexOf(currentMatch) + 1])}>
                  Pass
                </button>
                <button className="like-button" onClick={() => {/* Handle match */}}>
                  Like
                </button>
              </div>
            </div>
          ) : (
            <div className="no-matches">
              No more matches available at the moment
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchingInterface;
