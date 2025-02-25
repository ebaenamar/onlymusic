import { useEffect, useState } from 'react'
import { Box, Container, VStack, Image, Text, Button, useToast, Spinner } from '@chakra-ui/react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import useSWR from 'swr'

const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  const { data: matches, error } = useSWR(
    session ? '/api/match' : null,
    fetcher
  )

  const currentMatch = matches?.[currentMatchIndex]

  if (status === 'loading') {
    return (
      <Container centerContent py={20}>
        <VStack spacing={8}>
          <Spinner size="xl" color="green.500" />
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (!session) {
    return (
      <Container centerContent py={20} maxW="container.md">
        <VStack spacing={8}>
          <Text fontSize="4xl" fontWeight="bold" textAlign="center">
            Find Your Musical Soulmate
          </Text>
          <Text fontSize="xl" textAlign="center" color="gray.500">
            Connect with people who share your music taste
          </Text>
          <Image 
            src="/music-connection.jpg" 
            alt="Music Connection" 
            borderRadius="md"
            maxW="500px"
          />
          <Button 
            colorScheme="green" 
            size="lg"
            onClick={() => signIn('spotify')}
          >
            Connect with Spotify
          </Button>
        </VStack>
      </Container>
    )
  }

  const handleLike = async () => {
    try {
      await axios.post('/api/like', { matchId: currentMatch.id })
      toast({
        title: 'Like sent!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setCurrentMatchIndex(prev => (prev + 1) % matches.length)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send like',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSkip = () => {
    setCurrentMatchIndex(prev => (prev + 1) % matches.length)
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Text fontSize="2xl" fontWeight="bold">
          Welcome, {session.user?.name}!
        </Text>
        <Text>Your musical journey begins here...</Text>
        
        {matches ? (
          currentMatch ? (
            <Box>
              {/* Match display and interaction UI */}
            </Box>
          ) : (
            <Text>No matches found. Check back later!</Text>
          )
        ) : error ? (
          <Text>Error loading matches</Text>
        ) : (
          <Spinner />
        )}
      </VStack>
    </Container>
  )
}
