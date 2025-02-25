import { Box, Container, VStack, Text, Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'

export default function Custom404() {
  const router = useRouter()

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Page Not Found
        </Text>
        <Text>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button 
          colorScheme="green" 
          onClick={() => router.push('/')}
        >
          Go Home
        </Button>
      </VStack>
    </Container>
  )
}
