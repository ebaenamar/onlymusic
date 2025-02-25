import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  IconButton,
  Text,
  Collapse,
  Button,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  Progress,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaPlay,
  FaPause,
  FaForward,
  FaBackward,
  FaHeart,
  FaTimes,
  FaPlus,
  FaMusic,
} from 'react-icons/fa'
import MusicVisualizer from './MusicVisualizer'
import MusicCompatibilityViz from './MusicCompatibilityViz'

const MotionBox = motion(Box)

interface PlaylistTrack {
  id: string
  name: string
  artists: string[]
  previewUrl: string
  albumArt: string
  features: SpotifyApi.AudioFeaturesObject
}

interface MusicDiscoveryInterfaceProps {
  matchProfile: {
    id: string
    playlist: PlaylistTrack[]
    compatibility: number
    musicalPersonality: AdvancedPlaylistProfile
  }
  onMatch: (matchId: string) => void
  onPass: (matchId: string) => void
}

export default function MusicDiscoveryInterface({
  matchProfile,
  onMatch,
  onPass,
}: MusicDiscoveryInterfaceProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [likedTracks, setLikedTracks] = useState(new Set<string>())
  const [sharedPlaylist, setSharedPlaylist] = useState<PlaylistTrack[]>([])
  const { isOpen, onToggle } = useDisclosure()
  const [musicMatchScore, setMusicMatchScore] = useState(0)
  const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null)
  const [audioData, setAudioData] = useState({ frequency: new Float32Array(), waveform: new Float32Array() })

  const currentTrack = matchProfile.playlist[currentTrackIndex]

  useEffect(() => {
    // Set up Web Audio API for visualizations
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyzer = audioContext.createAnalyser()
    analyzer.fftSize = 2048
    setAudioAnalyzer(analyzer)

    return () => {
      audioContext.close()
    }
  }, [])

  useEffect(() => {
    if (audioAnalyzer && isPlaying) {
      const frequencyData = new Float32Array(audioAnalyzer.frequencyBinCount)
      const waveformData = new Float32Array(audioAnalyzer.frequencyBinCount)
      
      const updateData = () => {
        audioAnalyzer.getFloatFrequencyData(frequencyData)
        audioAnalyzer.getFloatTimeDomainData(waveformData)
        setAudioData({ frequency: frequencyData, waveform: waveformData })
        requestAnimationFrame(updateData)
      }
      
      updateData()
    }
  }, [audioAnalyzer, isPlaying])

  const handleTrackLike = (trackId: string) => {
    const newLikedTracks = new Set(likedTracks)
    newLikedTracks.add(trackId)
    setLikedTracks(newLikedTracks)
    
    // Add to shared playlist
    const track = matchProfile.playlist.find(t => t.id === trackId)
    if (track) {
      setSharedPlaylist([...sharedPlaylist, track])
    }

    // Update music match score
    const newScore = (newLikedTracks.size / matchProfile.playlist.length) * 100
    setMusicMatchScore(newScore)

    // If enough tracks are liked, enable matching
    if (newScore >= 70) {
      onMatch(matchProfile.id)
    }
  }

  const handleCreateCollaborativePlaylist = async () => {
    if (sharedPlaylist.length < 1) return

    const playlistName = `Our Musical Connection - ${new Date().toLocaleDateString()}`
    const tracks = sharedPlaylist.map(track => track.id)

    try {
      const response = await fetch('/api/create-collaborative-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          tracks,
          matchId: matchProfile.id,
        }),
      })

      if (response.ok) {
        // Handle successful playlist creation
      }
    } catch (error) {
      console.error('Error creating collaborative playlist:', error)
    }
  }

  return (
    <Box position="relative" h="100vh" overflow="hidden">
      {/* Music Visualizer Background */}
      <MusicVisualizer
        audioData={audioData}
        isPlaying={isPlaying}
        mood={currentTrack.features}
      />

      {/* Main Interface */}
      <VStack
        spacing={8}
        position="relative"
        h="full"
        justify="center"
        p={4}
        bg="rgba(0,0,0,0.7)"
        backdropFilter="blur(10px)"
      >
        <AnimatePresence mode="wait">
          <MotionBox
            key={currentTrack.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <VStack spacing={4}>
              <Box
                w={{ base: "300px", md: "400px" }}
                h={{ base: "300px", md: "400px" }}
                borderRadius="2xl"
                overflow="hidden"
                position="relative"
              >
                <motion.img
                  src={currentTrack.albumArt}
                  alt={currentTrack.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  whileHover={{ scale: 1.05 }}
                />
              </Box>

              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {currentTrack.name}
                </Text>
                <Text fontSize="md" color="gray.300">
                  {currentTrack.artists.join(', ')}
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        </AnimatePresence>

        {/* Playback Controls */}
        <HStack spacing={6}>
          <IconButton
            aria-label="Previous track"
            icon={<FaBackward />}
            onClick={() => setCurrentTrackIndex(i => (i > 0 ? i - 1 : i))}
            variant="ghost"
            color="white"
          />
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={() => setIsPlaying(!isPlaying)}
            variant="solid"
            colorScheme="green"
            size="lg"
          />
          <IconButton
            aria-label="Next track"
            icon={<FaForward />}
            onClick={() => setCurrentTrackIndex(i => (i < matchProfile.playlist.length - 1 ? i + 1 : i))}
            variant="ghost"
            color="white"
          />
        </HStack>

        {/* Like/Pass Controls */}
        <HStack spacing={8}>
          <IconButton
            aria-label="Pass"
            icon={<FaTimes />}
            onClick={() => onPass(matchProfile.id)}
            variant="outline"
            colorScheme="red"
            size="lg"
            borderRadius="full"
          />
          <IconButton
            aria-label="Like"
            icon={<FaHeart />}
            onClick={() => handleTrackLike(currentTrack.id)}
            variant="solid"
            colorScheme="green"
            size="lg"
            borderRadius="full"
            isDisabled={likedTracks.has(currentTrack.id)}
          />
        </HStack>

        {/* Music Match Progress */}
        <Box w="full" maxW="400px">
          <HStack justify="space-between" mb={2}>
            <Text color="white">Music Match</Text>
            <Text color="white">{Math.round(musicMatchScore)}%</Text>
          </HStack>
          <Progress
            value={musicMatchScore}
            colorScheme="green"
            borderRadius="full"
            hasStripe
            isAnimated
          />
        </Box>

        {/* Shared Playlist Drawer */}
        <Button
          leftIcon={<FaMusic />}
          onClick={onToggle}
          variant="ghost"
          color="white"
        >
          View Shared Playlist ({sharedPlaylist.length})
        </Button>

        <Drawer isOpen={isOpen} placement="bottom" onClose={onToggle}>
          <DrawerOverlay />
          <DrawerContent bg="gray.900" color="white">
            <DrawerHeader>Our Shared Musical Taste</DrawerHeader>
            <DrawerBody>
              <VStack spacing={4} pb={4}>
                {sharedPlaylist.map(track => (
                  <HStack
                    key={track.id}
                    w="full"
                    p={2}
                    bg="whiteAlpha.100"
                    borderRadius="lg"
                    justify="space-between"
                  >
                    <HStack>
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="md"
                        overflow="hidden"
                      >
                        <img
                          src={track.albumArt}
                          alt={track.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {track.name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {track.artists.join(', ')}
                        </Text>
                      </VStack>
                    </HStack>
                    <IconButton
                      aria-label="Remove from playlist"
                      icon={<FaTimes />}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPlaylist = sharedPlaylist.filter(t => t.id !== track.id)
                        setSharedPlaylist(newPlaylist)
                        likedTracks.delete(track.id)
                        setLikedTracks(new Set(likedTracks))
                      }}
                    />
                  </HStack>
                ))}

                {sharedPlaylist.length > 0 && (
                  <Button
                    leftIcon={<FaPlus />}
                    onClick={handleCreateCollaborativePlaylist}
                    colorScheme="green"
                    w="full"
                  >
                    Create Collaborative Playlist
                  </Button>
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </VStack>
    </Box>
  )
}
