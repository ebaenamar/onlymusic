import { useEffect, useRef } from 'react'
import { Box, Text, VStack, HStack, Progress } from '@chakra-ui/react'
import { motion, useAnimation } from 'framer-motion'
import * as d3 from 'd3'
import { AdvancedPlaylistProfile } from '../types/music'

interface MusicCompatibilityVizProps {
  userProfile: AdvancedPlaylistProfile
  matchProfile: AdvancedPlaylistProfile
  compatibilityScore: number
}

const MotionBox = motion(Box)

export default function MusicCompatibilityViz({
  userProfile,
  matchProfile,
  compatibilityScore
}: MusicCompatibilityVizProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const controls = useAnimation()

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous visualization
    svg.selectAll('*').remove()

    // Create musical DNA visualization
    const createMusicalDNA = () => {
      const genres = [...new Set([
        ...userProfile.genreSignature.primary,
        ...matchProfile.genreSignature.primary
      ])]

      const radius = Math.min(width, height) / 3
      const angleStep = (2 * Math.PI) / genres.length

      // Create circular layout
      const arcGenerator = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius)

      // Add genre segments
      genres.forEach((genre, i) => {
        const angle = i * angleStep
        const isShared = userProfile.genreSignature.primary.includes(genre) &&
                        matchProfile.genreSignature.primary.includes(genre)

        const segment = svg.append('path')
          .attr('d', arcGenerator({
            startAngle: angle,
            endAngle: angle + angleStep
          }))
          .attr('fill', isShared ? '#1DB954' : '#4A5568')
          .attr('opacity', 0.8)
          .attr('transform', `translate(${width/2}, ${height/2})`)

        // Add hover effects
        segment
          .on('mouseover', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', 1)
              .attr('transform', `translate(${width/2}, ${height/2}) scale(1.05)`)
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', 0.8)
              .attr('transform', `translate(${width/2}, ${height/2}) scale(1)`)
          })
      })

      // Add connecting lines for shared musical features
      const features = [
        'tempo',
        'energy',
        'valence',
        'danceability'
      ]

      features.forEach((feature, i) => {
        const angle = i * (2 * Math.PI / features.length)
        const userValue = userProfile.temporalPatterns.tempoDistribution[i]
        const matchValue = matchProfile.temporalPatterns.tempoDistribution[i]

        const line = svg.append('line')
          .attr('x1', width/2 + Math.cos(angle) * radius * 0.4 * userValue)
          .attr('y1', height/2 + Math.sin(angle) * radius * 0.4 * userValue)
          .attr('x2', width/2 + Math.cos(angle) * radius * 0.4 * matchValue)
          .attr('y2', height/2 + Math.sin(angle) * radius * 0.4 * matchValue)
          .attr('stroke', '#1DB954')
          .attr('stroke-width', 2)
          .attr('opacity', 0.6)
      })
    }

    // Create emotional journey visualization
    const createEmotionalJourney = () => {
      const userEmotions = userProfile.emotionalJourney.emotionalArc
      const matchEmotions = matchProfile.emotionalJourney.emotionalArc

      const lineGenerator = d3.line()
        .x((d, i) => i * (width / userEmotions.length))
        .y(d => height * (1 - d))
        .curve(d3.curveCatmullRom)

      // User's emotional journey
      svg.append('path')
        .datum(userEmotions)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#1DB954')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8)

      // Match's emotional journey
      svg.append('path')
        .datum(matchEmotions)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#4A5568')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8)

      // Add intersection points
      userEmotions.forEach((value, i) => {
        if (Math.abs(value - matchEmotions[i]) < 0.1) {
          svg.append('circle')
            .attr('cx', i * (width / userEmotions.length))
            .attr('cy', height * (1 - value))
            .attr('r', 4)
            .attr('fill', '#1DB954')
            .attr('opacity', 0.8)
        }
      })
    }

    createMusicalDNA()
    createEmotionalJourney()

  }, [userProfile, matchProfile])

  return (
    <VStack spacing={6} w="full" p={4}>
      <Text fontSize="2xl" fontWeight="bold" color="white">
        Musical Chemistry
      </Text>

      <Box position="relative" w="full" h="400px">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{
            background: 'transparent',
          }}
        />
      </Box>

      <VStack spacing={4} w="full">
        <HStack justify="space-between" w="full">
          <Text>Overall Compatibility</Text>
          <Text>{Math.round(compatibilityScore * 100)}%</Text>
        </HStack>
        <Progress
          value={compatibilityScore * 100}
          w="full"
          colorScheme="green"
          borderRadius="full"
          hasStripe
          isAnimated
        />

        <Box w="full" p={4} bg="whiteAlpha.100" borderRadius="lg">
          <VStack align="start" spacing={3}>
            <Text fontWeight="bold">Shared Musical Interests</Text>
            <HStack flexWrap="wrap" spacing={2}>
              {userProfile.genreSignature.primary
                .filter(genre => matchProfile.genreSignature.primary.includes(genre))
                .map(genre => (
                  <Box
                    key={genre}
                    px={3}
                    py={1}
                    bg="green.500"
                    color="white"
                    borderRadius="full"
                    fontSize="sm"
                  >
                    {genre}
                  </Box>
                ))}
            </HStack>
          </VStack>
        </Box>

        <Box w="full" p={4} bg="whiteAlpha.100" borderRadius="lg">
          <VStack align="start" spacing={3}>
            <Text fontWeight="bold">Musical Personality Match</Text>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm">Openness</Text>
              <Progress
                value={Math.min(
                  userProfile.listenerPersonality.openness,
                  matchProfile.listenerPersonality.openness
                ) * 100}
                w="50%"
                colorScheme="green"
                size="sm"
              />
            </HStack>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm">Eclecticism</Text>
              <Progress
                value={Math.min(
                  userProfile.listenerPersonality.eclecticism,
                  matchProfile.listenerPersonality.eclecticism
                ) * 100}
                w="50%"
                colorScheme="green"
                size="sm"
              />
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </VStack>
  )
}
