import { Box, Container, VStack, Text, Button, Image, useToast } from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

export default function SignIn() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const { error } = router.query

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error === 'AccessDenied' ? 'You need to allow Spotify access' : 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [error, toast])

  if (status === 'loading') {
    return (
      <Container centerContent>
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <Container 
      maxW="100vw" 
      h="100vh" 
      p={0} 
      bg="linear-gradient(135deg, #1DB954 0%, #191414 100%)"
    >
      <VStack 
        spacing={8} 
        w="full" 
        h="full" 
        justify="center" 
        align="center"
        px={4}
      >
        <MotionBox
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MotionImage
            src="/musicmatch-logo-v2.svg"
            alt="MusicMatch Logo"
            w={{ base: "200px", md: "300px" }}
            mb={8}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </MotionBox>

        <VStack spacing={4} textAlign="center">
          <Text
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="bold"
            color="white"
          >
            Find Your Musical Soulmate
          </Text>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="whiteAlpha.900"
          >
            Connect through the music that moves you
          </Text>
        </VStack>

        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          w={{ base: "full", md: "auto" }}
          maxW="400px"
        >
          <VStack spacing={4} width="full">
            <Button
              size="lg"
              w="full"
              bg="#1DB954"
              color="white"
              _hover={{ bg: "#1ed760" }}
              leftIcon={
                <Image
                  src="/spotify-icon.png"
                  alt="Spotify"
                  w="24px"
                  h="24px"
                />
              }
              onClick={() => signIn('spotify', { callbackUrl: '/' })}
            >
              Continue with Spotify
            </Button>
            
            <Text color="white" fontWeight="bold">OR</Text>
            
            <Button
              size="lg"
              w="full"
              colorScheme="blue"
              onClick={() => signIn('credentials', { 
                username: 'demo', 
                password: 'demo123',
                callbackUrl: '/' 
              })}
            >
              Use Demo Account
            </Button>
          </VStack>
        </MotionBox>

        <Text
          fontSize="sm"
          color="whiteAlpha.700"
          maxW="md"
          textAlign="center"
          mt={8}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </VStack>
    </Container>
  )
}
