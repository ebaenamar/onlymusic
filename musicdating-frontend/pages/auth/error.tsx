import { Box, Container, VStack, Text, Button, Image, Heading } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

export default function ErrorPage() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You need to allow access to your Spotify account.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      default:
        return 'An unexpected error occurred.'
    }
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
            src="/musicmatch-logo-v3.svg"
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
          
          <Text color="white" textAlign="center">
            {error ? getErrorMessage(error as string) : 'An error occurred during authentication.'}
          </Text>
          
          <Text color="white" textAlign="center">
            You can try again with Spotify or use our demo account option instead.
          </Text>
          
          <Button 
            colorScheme="green" 
            onClick={() => router.push('/auth/signin')}
            size="lg"
            width="full"
          >
            Back to Sign In
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}
