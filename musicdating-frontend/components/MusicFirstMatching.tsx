import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Progress,
  Button,
  Badge,
  useDisclosure,
} from '@chakra-ui/react'
import { FaPlay, FaCheck, FaMusic } from 'react-icons/fa'
import { MatchingService } from '../services/matching'

interface Track {
  id: string
  name: string
  albumArt: string
}

interface Match {
  id: string
  name: string
  recentTracks: Track[]
  matchScore: number
}

export default function MusicFirstMatching() {
  const [matches, setMatches] = useState<Match[]>([])
  const [listenedTracks, setListenedTracks] = useState(new Set<string>())
  const { isOpen, onOpen, onClose } = useDisclosure()
  const matchingService = new MatchingService()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const matches = await matchingService.getPotentialMatches()
      setMatches(matches)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleTrackPlay = (track: Track) => {
    setListenedTracks(prev => new Set([...prev, track.id]))
  }

  const calculateProgress = (match: Match) => {
    const required = Math.ceil(match.recentTracks.length * 0.5)
    const listened = match.recentTracks.filter(t => listenedTracks.has(t.id)).length
    return (listened / required) * 100
  }

  const canViewProfile = (match: Match) => calculateProgress(match) >= 100

  return (
    <Box p={4}>
      <VStack spacing={6}>
        <Text fontSize="2xl" fontWeight="bold">Discover Through Music</Text>
        
        {matches.map(match => (
          <Box key={match.id} w="full" maxW="600px" bg="whiteAlpha.100" p={4} borderRadius="xl">
            <VStack spacing={4}>
              {/* Progress */}
              <HStack w="full" justify="space-between">
                <Text>Listening Progress</Text>
                <Text>{Math.round(calculateProgress(match))}%</Text>
              </HStack>
              <Progress value={calculateProgress(match)} w="full" colorScheme="green" />
              
              {/* Match Score */}
              <Badge colorScheme="green">
                <HStack spacing={2}>
                  <FaMusic />
                  <Text>{Math.round(match.matchScore * 100)}% Match</Text>
                </HStack>
              </Badge>

              {/* Tracks */}
              <HStack spacing={2} overflow="auto" w="full">
                {match.recentTracks.map(track => (
                  <Box key={track.id} bg="whiteAlpha.200" p={2} borderRadius="lg">
                    <VStack>
                      <Image src={track.albumArt} alt={track.name} boxSize="80px" borderRadius="md" />
                      <Text fontSize="sm">{track.name}</Text>
                      <Button
                        size="sm"
                        leftIcon={listenedTracks.has(track.id) ? <FaCheck /> : <FaPlay />}
                        onClick={() => handleTrackPlay(track)}
                        colorScheme="green"
                      >
                        {listenedTracks.has(track.id) ? 'Listened' : 'Listen'}
                      </Button>
                    </VStack>
                  </Box>
                ))}
              </HStack>

              <Button
                w="full"
                colorScheme="green"
                isDisabled={!canViewProfile(match)}
                onClick={onOpen}
              >
                {canViewProfile(match) ? 'View Profile' : 'Listen to More Tracks'}
              </Button>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
