import { Box, Container, VStack, Text, Button, Image, useToast, Spinner } from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

export default function SignIn() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const { error, callbackUrl } = router.query
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (session) {
      router.push(callbackUrl as string || '/')
    }
  }, [session, router, callbackUrl])

  useEffect(() => {
    if (error) {
      let errorMessage = 'Something went wrong with authentication'
      
      if (error === 'AccessDenied') {
        errorMessage = 'You need to allow Spotify access'
      } else if (error === 'NoEmailProvided') {
        errorMessage = 'No email was provided by Spotify'
      } else if (error === 'Callback') {
        errorMessage = 'Authentication callback failed'
      } else if (error === 'OAuthSignin') {
        errorMessage = 'Error starting OAuth sign in'
      } else if (error === 'OAuthCallback') {
        errorMessage = 'Error completing OAuth sign in'
      }
      
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [error, toast])

  const handleDemoSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn('demo-login', { 
        username: 'demo', 
        password: 'demo123',
        callbackUrl: callbackUrl as string || '/' 
      })
    } catch (error) {
      toast({
        title: 'Sign In Error',
        description: 'Failed to sign in with demo account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSpotifySignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn('spotify', { 
        callbackUrl: callbackUrl as string || '/' 
      })
    } catch (error) {
      toast({
        title: 'Sign In Error',
        description: 'Failed to sign in with Spotify. Please try again or use the demo account.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  if (status === 'loading' || isSigningIn) {
    return (
      <Container centerContent h="100vh">
        <VStack spacing={4} justify="center" h="full">
          <Spinner size="xl" color="green.500" />
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container 
      maxW="100vw" 
      h="100vh" 
      p={0} 
      bg="linear-gradient(135deg, #FF4B91 0%, #FF9B54 50%, #6C63FF 100%)"
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
            src="/musicmatch-logo-fun.svg"
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
            Compatible Vibes
          </Text>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="whiteAlpha.900"
          >
            Connect through musical harmony
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
              colorScheme="pink"
              onClick={handleDemoSignIn}
              isLoading={isSigningIn}
              loadingText="Signing in..."
            >
              Use Demo Account
            </Button>
            
            <Text color="white" fontWeight="bold">OR</Text>
            
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
              onClick={handleSpotifySignIn}
              isLoading={isSigningIn}
              loadingText="Connecting to Spotify..."
            >
              Continue with Spotify
            </Button>
            
            <Text color="whiteAlpha.700" fontSize="xs" textAlign="center">
              Note: Spotify login requires proper API configuration.
              Demo account works for everyone!
            </Text>
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
