import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Input,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tag,
  Wrap,
  WrapItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaPlay,
  FaPause,
  FaArrowUp,
  FaArrowDown,
  FaTimes,
  FaRandom,
  FaSave,
  FaShare,
} from 'react-icons/fa'

const MotionBox = motion(Box)

interface Track {
  id: string
  name: string
  artists: string[]
  albumArt: string
  audioFeatures: SpotifyApi.AudioFeaturesObject
  preview_url: string
}

interface CollaborativePlaylistProps {
  matchId: string
  userTracks: Track[]
  matchTracks: Track[]
  onSave: (playlist: { name: string; tracks: Track[] }) => Promise<void>
}

export default function CollaborativePlaylist({
  matchId,
  userTracks,
  matchTracks,
  onSave,
}: CollaborativePlaylistProps) {
  const [playlistName, setPlaylistName] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [energyLevel, setEnergyLevel] = useState(0.5)
  const [danceabilityLevel, setDanceabilityLevel] = useState(0.5)
  const [moodLevel, setMoodLevel] = useState(0.5)
  const toast = useToast()

  useEffect(() => {
    // Initialize tracks with a balanced mix
    const initialTracks = balanceTracks(userTracks, matchTracks)
    setTracks(initialTracks)
  }, [userTracks, matchTracks])

  const balanceTracks = (userTracks: Track[], matchTracks: Track[]): Track[] => {
    const balanced: Track[] = []
    const maxLength = Math.max(userTracks.length, matchTracks.length)
    
    for (let i = 0; i < maxLength; i++) {
      if (userTracks[i]) balanced.push(userTracks[i])
      if (matchTracks[i]) balanced.push(matchTracks[i])
    }
    
    return balanced
  }

  const handleTrackMove = (index: number, direction: 'up' | 'down') => {
    const newTracks = [...tracks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < tracks.length) {
      [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]]
      setTracks(newTracks)
    }
  }

  const handleTrackRemove = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index))
  }

  const handleShuffle = () => {
    setTracks([...tracks].sort(() => Math.random() - 0.5))
  }

  const handleOptimize = () => {
    const optimizedTracks = [...tracks].sort((a, b) => {
      const aScore = calculateTrackScore(a)
      const bScore = calculateTrackScore(b)
      return bScore - aScore
    })
    setTracks(optimizedTracks)
  }

  const calculateTrackScore = (track: Track) => {
    const energyDiff = Math.abs(track.audioFeatures.energy - energyLevel)
    const danceabilityDiff = Math.abs(track.audioFeatures.danceability - danceabilityLevel)
    const valenceDiff = Math.abs(track.audioFeatures.valence - moodLevel)
    
    return 1 - ((energyDiff + danceabilityDiff + valenceDiff) / 3)
  }

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) {
      toast({
        title: 'Please enter a playlist name',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      await onSave({
        name: playlistName,
        tracks,
      })
      
      toast({
        title: 'Playlist saved!',
        description: 'Your collaborative playlist has been created.',
        status: 'success',
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: 'Error saving playlist',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleSharePlaylist = async () => {
    try {
      const shareUrl = `${window.location.origin}/shared-playlist/${matchId}`
      await navigator.clipboard.writeText(shareUrl)
      
      toast({
        title: 'Share link copied!',
        description: 'Send this link to share your playlist.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error copying link',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <VStack spacing={6} w="full" p={4}>
      <HStack w="full" justify="space-between">
        <Input
          placeholder="Enter playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          maxW="300px"
        />
        <HStack>
          <Button
            leftIcon={<FaRandom />}
            onClick={handleShuffle}
            variant="ghost"
          >
            Shuffle
          </Button>
          <Button
            leftIcon={<FaSave />}
            onClick={handleSavePlaylist}
            colorScheme="green"
          >
            Save
          </Button>
          <IconButton
            aria-label="Share playlist"
            icon={<FaShare />}
            onClick={handleSharePlaylist}
          />
        </HStack>
      </HStack>

      <Box w="full" p={4} bg="whiteAlpha.100" borderRadius="lg">
        <VStack spacing={4}>
          <Text>Playlist Mood</Text>
          <HStack w="full" spacing={8}>
            <VStack flex={1}>
              <Text fontSize="sm">Energy</Text>
              <Slider
                value={energyLevel}
                onChange={setEnergyLevel}
                min={0}
                max={1}
                step={0.1}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="green.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>
            <VStack flex={1}>
              <Text fontSize="sm">Danceability</Text>
              <Slider
                value={danceabilityLevel}
                onChange={setDanceabilityLevel}
                min={0}
                max={1}
                step={0.1}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="green.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>
            <VStack flex={1}>
              <Text fontSize="sm">Mood</Text>
              <Slider
                value={moodLevel}
                onChange={setMoodLevel}
                min={0}
                max={1}
                step={0.1}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="green.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>
          </HStack>
          <Button
            leftIcon={<FaRandom />}
            onClick={handleOptimize}
            size="sm"
          >
            Optimize Order
          </Button>
        </VStack>
      </Box>

      <VStack w="full" spacing={2}>
        <AnimatePresence>
          {tracks.map((track, index) => (
            <MotionBox
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              w="full"
            >
              <HStack
                w="full"
                p={2}
                bg="whiteAlpha.100"
                borderRadius="lg"
                justify="space-between"
              >
                <HStack flex={1}>
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <img
                      src={track.albumArt}
                      alt={track.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
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

                <HStack>
                  <IconButton
                    aria-label="Move up"
                    icon={<FaArrowUp />}
                    variant="ghost"
                    size="sm"
                    isDisabled={index === 0}
                    onClick={() => handleTrackMove(index, 'up')}
                  />
                  <IconButton
                    aria-label="Move down"
                    icon={<FaArrowDown />}
                    variant="ghost"
                    size="sm"
                    isDisabled={index === tracks.length - 1}
                    onClick={() => handleTrackMove(index, 'down')}
                  />
                  <IconButton
                    aria-label="Remove track"
                    icon={<FaTimes />}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTrackRemove(index)}
                  />
                </HStack>
              </HStack>
            </MotionBox>
          ))}
        </AnimatePresence>
      </VStack>
    </VStack>
  )
}
