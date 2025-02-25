import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  Badge,
  useToast,
  Fade,
  Tooltip
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { motion } from 'framer-motion'
import { FaHeadphones, FaHeart, FaComment, FaSpotify } from 'react-icons/fa'
import SpotifyPlayer from 'react-spotify-web-playback'

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

interface MusicMoment {
  id: string
  userId: string
  userPhoto: string
  userName: string
  track: {
    id: string
    name: string
    artist: string
    albumArt: string
  }
  timestamp: Date
  mood?: string
  activity?: string
  listeners: number
}

export default function MusicMoments() {
  const [currentMoments, setCurrentMoments] = useState<MusicMoment[]>([])
  const [userTrack, setUserTrack] = useState<string | null>(null)
  const [matches, setMatches] = useState<MusicMoment[]>([])
  const toast = useToast()

  useEffect(() => {
    // Poll for current music moments
    const interval = setInterval(fetchCurrentMoments, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCurrentMoments = async () => {
    // Get currently playing tracks from users in your area/preferences
    const response = await fetch('/api/moments/current')
    const moments = await response.json()
    setCurrentMoments(moments)
    
    // Check for matches with your current track
    if (userTrack) {
      const matchingMoments = moments.filter(m => 
        m.track.id === userTrack || 
        m.track.artist === userTrack.artist
      )
      if (matchingMoments.length > 0) {
        notifyMatches(matchingMoments)
      }
    }
  }

  const notifyMatches = (matches: MusicMoment[]) => {
    toast({
      title: "Music Match! 🎵",
      description: `${matches.length} people are vibing to your music right now!`,
      status: "success",
      duration: 5000,
      isClosable: true,
    })
  }

  const handleConnect = async (moment: MusicMoment) => {
    // Create a music-based chat room
    const chatRoom = await fetch('/api/chat/create', {
      method: 'POST',
      body: JSON.stringify({
        momentId: moment.id,
        trackId: moment.track.id
      })
    })
    
    // Navigate to chat
    // router.push(/chat/${chatRoom.id})
  }

  return (
    <VStack spacing={6} w="full" p={4}>
      {/* Currently Playing Section */}
      <Box
        w="full"
        bg="whiteAlpha.100"
        borderRadius="xl"
        p={4}
        position="relative"
        overflow="hidden"
      >
        <HStack spacing={4}>
          <Box position="relative">
            {userTrack && (
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Image
                  src={userTrack.albumArt}
                  boxSize="100px"
                  borderRadius="lg"
                  objectFit="cover"
                />
              </motion.div>
            )}
            <Badge
              position="absolute"
              bottom={-2}
              right={-2}
              colorScheme="green"
              borderRadius="full"
              p={2}
            >
              <FaHeadphones />
            </Badge>
          </Box>
          
          <VStack align="start" flex={1}>
            <Text fontSize="lg" fontWeight="bold">
              {userTrack ? userTrack.name : "Nothing playing"}
            </Text>
            {userTrack && (
              <Text color="gray.400">{userTrack.artist}</Text>
            )}
            <HStack>
              <Button
                size="sm"
                leftIcon={<FaSpotify />}
                colorScheme="green"
                variant="outline"
                onClick={() => {/* Refresh Spotify status */}}
              >
                Update Status
              </Button>
              {userTrack && (
                <Badge colorScheme="purple">
                  {matches.length} people listening
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Live Music Moments Feed */}
      <VStack w="full" spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Live Music Moments
        </Text>
        
        {currentMoments.map(moment => (
          <Box
            key={moment.id}
            w="full"
            bg="whiteAlpha.50"
            borderRadius="lg"
            p={4}
            _hover={{ bg: "whiteAlpha.100" }}
            transition="all 0.2s"
          >
            <HStack spacing={4}>
              <Image
                src={moment.userPhoto}
                boxSize="50px"
                borderRadius="full"
              />
              
              <VStack align="start" flex={1}>
                <HStack justify="space-between" w="full">
                  <Text fontWeight="bold">{moment.userName}</Text>
                  <Text color="gray.400" fontSize="sm">
                    {new Date(moment.timestamp).toLocaleTimeString()}
                  </Text>
                </HStack>
                
                <HStack>
                  <Image
                    src={moment.track.albumArt}
                    boxSize="40px"
                    borderRadius="md"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm">{moment.track.name}</Text>
                    <Text fontSize="xs" color="gray.400">
                      {moment.track.artist}
                    </Text>
                  </VStack>
                </HStack>
                
                {moment.mood && (
                  <Badge colorScheme="purple" fontSize="xs">
                    Feeling {moment.mood}
                  </Badge>
                )}
                
                <HStack spacing={4}>
                  <Tooltip label="Listen Together">
                    <Button
                      size="sm"
                      leftIcon={<FaHeadphones />}
                      colorScheme="green"
                      variant="ghost"
                      onClick={() => {/* Start shared listening */}}
                    >
                      Join ({moment.listeners})
                    </Button>
                  </Tooltip>
                  
                  <Tooltip label="Connect">
                    <Button
                      size="sm"
                      leftIcon={<FaComment />}
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => handleConnect(moment)}
                    >
                      Connect
                    </Button>
                  </Tooltip>
                </HStack>
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* Spotify Web Playback */}
      {userTrack && (
        <Box w="full" position="fixed" bottom={0} left={0} p={4}>
          <SpotifyPlayer
            token="SPOTIFY_TOKEN"
            uris={[`spotify:track:${userTrack.id}`]}
            styles={{
              bgColor: '#000',
              color: '#fff',
              loaderColor: '#fff',
              sliderColor: '#1cb954',
              savedColor: '#fff',
              trackArtistColor: '#ccc',
              trackNameColor: '#fff',
            }}
          />
        </Box>
      )}
    </VStack>
  )
}
