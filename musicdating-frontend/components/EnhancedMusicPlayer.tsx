import { useState, useEffect } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Image,
  Collapse,
  Badge,
  useDisclosure,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaHeart,
  FaRegHeart,
  FaChevronUp,
  FaChevronDown,
  FaRandom,
} from 'react-icons/fa'
import { IoMusicalNotes } from 'react-icons/io5'

const MotionBox = motion(Box)

interface Track {
  id: string
  name: string
  artist: string
  albumArt: string
  duration: number
  previewUrl: string
  genres: string[]
}

interface EnhancedMusicPlayerProps {
  playlist: {
    id: string
    name: string
    tracks: Track[]
    owner: string
    imageUrl: string
  }
  onLikeTrack: (trackId: string) => void
  likedTracks: Set<string>
}

export default function EnhancedMusicPlayer({
  playlist,
  onLikeTrack,
  likedTracks,
}: EnhancedMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const { isOpen, onToggle } = useDisclosure()
  const [shuffleMode, setShuffleMode] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const currentTrack = playlist.tracks[currentTrackIndex]

  useEffect(() => {
    if (!audioElement) {
      const audio = new Audio()
      audio.addEventListener('timeupdate', () => {
        setProgress((audio.currentTime / audio.duration) * 100)
      })
      audio.addEventListener('ended', handleNext)
      setAudioElement(audio)
    }

    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.removeEventListener('timeupdate', () => {})
        audioElement.removeEventListener('ended', handleNext)
      }
    }
  }, [])

  useEffect(() => {
    if (audioElement) {
      audioElement.src = currentTrack.previewUrl
      if (isPlaying) {
        audioElement.play()
      }
    }
  }, [currentTrackIndex, currentTrack])

  const togglePlay = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleNext = () => {
    if (shuffleMode) {
      const nextIndex = Math.floor(Math.random() * playlist.tracks.length)
      setCurrentTrackIndex(nextIndex)
    } else {
      setCurrentTrackIndex((prev) =>
        prev === playlist.tracks.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handlePrevious = () => {
    if (shuffleMode) {
      const nextIndex = Math.floor(Math.random() * playlist.tracks.length)
      setCurrentTrackIndex(nextIndex)
    } else {
      setCurrentTrackIndex((prev) =>
        prev === 0 ? playlist.tracks.length - 1 : prev - 1
      )
    }
  }

  const handleSeek = (value: number) => {
    if (audioElement) {
      const time = (value / 100) * audioElement.duration
      audioElement.currentTime = time
      setProgress(value)
    }
  }

  return (
    <MotionBox
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="rgba(18, 18, 18, 0.98)"
      backdropFilter="blur(10px)"
      borderTop="1px solid"
      borderColor="whiteAlpha.200"
      p={4}
    >
      <VStack spacing={4}>
        <HStack w="full" justify="space-between">
          <IconButton
            aria-label="Expand player"
            icon={isOpen ? <FaChevronDown /> : <FaChevronUp />}
            variant="ghost"
            onClick={onToggle}
          />
          <Text fontSize="sm" color="whiteAlpha.700">
            Playing from playlist
          </Text>
          <IconButton
            aria-label="Shuffle"
            icon={<FaRandom />}
            variant="ghost"
            color={shuffleMode ? 'green.400' : 'whiteAlpha.700'}
            onClick={() => setShuffleMode(!shuffleMode)}
          />
        </HStack>

        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={4} pb={4}>
            <Image
              src={currentTrack.albumArt}
              alt={currentTrack.name}
              boxSize="200px"
              borderRadius="lg"
              objectFit="cover"
            />
            
            <HStack spacing={2} flexWrap="wrap" justify="center">
              {currentTrack.genres.map((genre) => (
                <Badge
                  key={genre}
                  colorScheme="green"
                  variant="subtle"
                  fontSize="xs"
                >
                  {genre}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </Collapse>

        <VStack w="full" spacing={2}>
          <HStack w="full" justify="space-between">
            <VStack align="start" flex={1} spacing={0}>
              <Text fontSize="md" fontWeight="bold" noOfLines={1}>
                {currentTrack.name}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.700" noOfLines={1}>
                {currentTrack.artist}
              </Text>
            </VStack>
            <IconButton
              aria-label={likedTracks.has(currentTrack.id) ? 'Unlike' : 'Like'}
              icon={likedTracks.has(currentTrack.id) ? <FaHeart /> : <FaRegHeart />}
              variant="ghost"
              color={likedTracks.has(currentTrack.id) ? 'green.400' : 'whiteAlpha.700'}
              onClick={() => onLikeTrack(currentTrack.id)}
            />
          </HStack>

          <Slider
            aria-label="Progress bar"
            value={progress}
            onChange={handleSeek}
            min={0}
            max={100}
          >
            <SliderTrack bg="whiteAlpha.200">
              <SliderFilledTrack bg="green.400" />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>

          <HStack w="full" justify="space-between" pt={2}>
            <IconButton
              aria-label="Previous track"
              icon={<FaStepBackward />}
              variant="ghost"
              onClick={handlePrevious}
            />
            <IconButton
              aria-label={isPlaying ? 'Pause' : 'Play'}
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              variant="solid"
              colorScheme="green"
              size="lg"
              onClick={togglePlay}
            />
            <IconButton
              aria-label="Next track"
              icon={<FaStepForward />}
              variant="ghost"
              onClick={handleNext}
            />
          </HStack>
        </VStack>
      </VStack>
    </MotionBox>
  )
}
