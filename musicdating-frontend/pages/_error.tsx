import { NextPage } from 'next'
import { Box, Container, Text, VStack } from '@chakra-ui/react'

interface Props {
  statusCode?: number
  message?: string
}

const Error: NextPage<Props> = ({ statusCode, message }) => {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={4}>
        <Text fontSize="xl">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </Text>
        {message && <Text>{message}</Text>}
      </VStack>
    </Container>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
