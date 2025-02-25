import { Box, Container, VStack, Text, Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'

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
    <Container maxW="container.md" py={10}>
      <VStack spacing={6}>
        <Text fontSize="2xl" fontWeight="bold" color="red.500">
          Authentication Error
        </Text>
        <Text>
          {error ? getErrorMessage(error as string) : 'An error occurred during authentication.'}
        </Text>
        <Button 
          colorScheme="green" 
          onClick={() => router.push('/auth/signin')}
        >
          Try Again
        </Button>
      </VStack>
    </Container>
  )
}
