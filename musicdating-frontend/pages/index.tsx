import { useEffect, useState } from 'react'
import { Box, Container, VStack, Image, Text, Button, useToast, Spinner } from '@chakra-ui/react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()

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
          <Button
            size="lg"
            colorScheme="green"
            onClick={() => signIn('spotify', { callbackUrl: '/' })}
            leftIcon={
              <Image
                src="/spotify-icon.png"
                alt="Spotify"
                width={6}
                height={6}
              />
            }
          >
            Sign in with Spotify
          </Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Text fontSize="2xl" fontWeight="bold">
          Welcome, {session.user?.name}!
        </Text>
        <Text>Your musical journey begins here...</Text>
      </VStack>
    </Container>
  )

const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function Home() {
  const { data: session } = useSession()
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const toast = useToast()

  const { data: matches, error } = useSWR(
    session ? '/api/match' : null,
    fetcher
  )

  const currentMatch = matches?.[currentMatchIndex]

  const handleLike = async () => {
    try {
      await axios.post('/api/like', { matchId: currentMatch.id })
      toast({
        title: 'Like sent!',
        status: 'success',
        duration: 3000,
      })
      setCurrentMatchIndex(prev => prev + 1)
    } catch (error) {
      toast({
        title: 'Error sending like',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handlePass = () => {
    setCurrentMatchIndex(prev => prev + 1)
  }

  if (!session) {
    return (
      <Container centerContent py={20}>
        <VStack spacing={8}>
          <Text fontSize="2xl" fontWeight="bold">
            Find your musical soulmate
          </Text>
          <Button
            colorScheme="green"
            size="lg"
            onClick={() => signIn('spotify')}
          >
            Sign in with Spotify
          </Button>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return <div>Error loading matches</div>
  }

  if (!matches) {
    return <div>Loading...</div>
  }

  return (
    <Container maxW="xl" py={8}>
      {currentMatch ? (
        <VStack spacing={6}>
          <Box
            position="relative"
            w="100%"
            h="500px"
            borderRadius="lg"
            overflow="hidden"
          >
            <Image
              src={currentMatch.photoUrl}
              alt="Profile photo"
              objectFit="cover"
              w="100%"
              h="100%"
            />
            <Box
              position="absolute"
              bottom={4}
              left={4}
              bg="blackAlpha.700"
              color="white"
              px={4}
              py={2}
              borderRadius="md"
            >
              {Math.round(currentMatch.score * 100)}% Match
            </Box>
          </Box>

          <Box w="100%">
            <SpotifyPlayer
              token={session.accessToken}
              uris={[`spotify:playlist:${currentMatch.playlistId}`]}
              styles={{
                activeColor: '#fff',
                bgColor: '#333',
                color: '#fff',
                loaderColor: '#fff',
                sliderColor: '#1cb954',
                trackArtistColor: '#ccc',
                trackNameColor: '#fff',
              }}
            />
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            w="100%"
            px={4}
          >
            <Button
              size="lg"
              onClick={handlePass}
              colorScheme="gray"
            >
              Pass
            </Button>
            <Button
              size="lg"
              onClick={handleLike}
              colorScheme="green"
            >
              Like
            </Button>
          </Box>
        </VStack>
      ) : (
        <VStack spacing={4}>
          <Text fontSize="xl">No more matches available</Text>
          <Text color="gray.500">Check back later!</Text>
        </VStack>
      )}
    </Container>
  )
}
