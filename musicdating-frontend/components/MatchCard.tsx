import { useState } from 'react'
import { Box, Image, Text, IconButton, VStack, HStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeart, FaTimes, FaPlay, FaPause } from 'react-icons/fa'

const MotionBox = motion(Box)

interface MatchCardProps {
  match: {
    id: string
    photoUrl: string
    playlistName: string
    score: number
  }
  onLike: () => void
  onPass: () => void
  isPlaying: boolean
  onTogglePlay: () => void
}

export default function MatchCard({ match, onLike, onPass, isPlaying, onTogglePlay }: MatchCardProps) {
  const [direction, setDirection] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false)
    const swipe = info.offset.x
    const threshold = 100

    if (Math.abs(swipe) > threshold) {
      if (swipe > 0) {
        setDirection('right')
        onLike()
      } else {
        setDirection('left')
        onPass()
      }
    }
  }

  return (
    <AnimatePresence>
      <MotionBox
        position="relative"
        w="full"
        h={{ base: "70vh", md: "600px" }}
        borderRadius="2xl"
        overflow="hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        animate={{
          rotate: isDragging ? (direction === 'right' ? 5 : -5) : 0,
          x: direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0
        }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src={match.photoUrl}
          alt="Profile photo"
          objectFit="cover"
          w="full"
          h="full"
        />

        {/* Gradient overlay */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="50%"
          bgGradient="linear(to-t, blackAlpha.800, transparent)"
        />

        {/* Content overlay */}
        <VStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={6}
          spacing={4}
          align="stretch"
        >
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text
                color="white"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="bold"
              >
                {match.playlistName}
              </Text>
              <Text
                color="green.300"
                fontSize={{ base: "md", md: "lg" }}
              >
                {Math.round(match.score * 100)}% Match
              </Text>
            </VStack>
            <IconButton
              aria-label={isPlaying ? "Pause" : "Play"}
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              onClick={onTogglePlay}
              variant="solid"
              colorScheme="green"
              size="lg"
              isRound
            />
          </HStack>

          <HStack justify="space-evenly" pt={4}>
            <IconButton
              aria-label="Pass"
              icon={<FaTimes />}
              onClick={onPass}
              variant="solid"
              colorScheme="red"
              size="lg"
              isRound
            />
            <IconButton
              aria-label="Like"
              icon={<FaHeart />}
              onClick={onLike}
              variant="solid"
              colorScheme="green"
              size="lg"
              isRound
            />
          </HStack>
        </VStack>
      </MotionBox>
    </AnimatePresence>
  )
}
