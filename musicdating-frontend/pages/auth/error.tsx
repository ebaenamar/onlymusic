import { Box, Container, VStack, Text, Button, Image, Heading, Alert, AlertIcon } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

export default function ErrorPage() {
  const router = useRouter()
  const { error } = router.query
  const [isSigningIn, setIsSigningIn] = useState(false)

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. The authentication providers may not be properly set up.'
      case 'AccessDenied':
        return 'You need to allow access to your Spotify account to continue with Spotify authentication.'
      case 'Verification':
        return 'The verification token has expired or has already been used. Please try signing in again.'
      case 'INVALID_CLIENT':
        return 'The Spotify client is not properly configured for this domain. This might happen in preview deployments.'
      case 'OAuthSignin':
        return 'Error starting the OAuth sign-in process. The authentication provider might be unavailable.'
      case 'OAuthCallback':
        return 'Error completing the OAuth sign-in process. The authentication provider returned an error.'
      case 'OAuthCreateAccount':
        return 'Could not create a user account using the OAuth provider.'
      case 'EmailCreateAccount':
        return 'Could not create a user account using the email provider.'
      case 'Callback':
        return 'The authentication callback failed. This might be due to a misconfiguration.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Sign in using the original provider.'
      case 'NoEmailProvided':
        return 'No email was provided by Spotify. Make sure your Spotify account has an email associated with it.'
      case 'SessionRequired':
        return 'You need to be signed in to access this page.'
      default:
        return 'An unexpected authentication error occurred. Please try again or use the demo account.'
    }
  }

  const handleDemoSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn('demo-login', { 
        username: 'demo', 
        password: 'demo123',
        callbackUrl: '/' 
      })
    } catch (error) {
      console.error('Demo sign in error:', error)
    } finally {
      setIsSigningIn(false)
    }
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
            w={{ base: "150px", md: "200px" }}
            mb={8}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </MotionBox>

        <VStack spacing={6} bg="blackAlpha.700" p={8} borderRadius="md" maxW="md">
          <Heading fontSize="2xl" fontWeight="bold" color="red.500">
            Authentication Error
          </Heading>
          
          <Alert status="error" variant="solid" borderRadius="md">
            <AlertIcon />
            {error ? getErrorMessage(error as string) : 'An error occurred during authentication.'}
          </Alert>
          
          <Text color="white" textAlign="center">
            No worries! You can use our demo account instead to explore the app.
          </Text>
          
          <Button 
            colorScheme="pink" 
            size="lg"
            width="full"
            onClick={handleDemoSignIn}
            isLoading={isSigningIn}
            loadingText="Signing in..."
          >
            Use Demo Account
          </Button>
          
          <Button 
            variant="outline"
            colorScheme="whiteAlpha" 
            onClick={() => router.push('/auth/signin')}
            size="md"
            width="full"
          >
            Back to Sign In
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}
