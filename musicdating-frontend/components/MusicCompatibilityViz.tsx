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
            endAngle: angle + angleStep,
            innerRadius: radius * 0.6,
            outerRadius: radius
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
        'slow',
        'medium',
        'fast'
      ]

      features.forEach((feature, i) => {
        const angle = i * (2 * Math.PI / features.length)
        const userValue = userProfile.tempoDistribution[features[i] as keyof typeof userProfile.tempoDistribution]
        const matchValue = matchProfile.tempoDistribution[features[i] as keyof typeof matchProfile.tempoDistribution]

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

    // Create mood profile visualization
    const createMoodProfile = () => {
      const userMood = userProfile.moodProfile
      const matchMood = matchProfile.moodProfile

      const moodFeatures = ['energy', 'danceability', 'valence']
      const angleStep = (2 * Math.PI) / moodFeatures.length
      const radius = Math.min(width, height) / 3

      moodFeatures.forEach((feature, i) => {
        const angle = i * angleStep
        const userValue = userMood[feature as keyof typeof userMood]
        const matchValue = matchMood[feature as keyof typeof matchMood]

        // Draw axes
        svg.append('line')
          .attr('x1', width/2)
          .attr('y1', height/2)
          .attr('x2', width/2 + Math.cos(angle) * radius)
          .attr('y2', height/2 + Math.sin(angle) * radius)
          .attr('stroke', '#2D3748')
          .attr('stroke-width', 1)
          .attr('opacity', 0.3)

        // Draw user point
        svg.append('circle')
          .attr('cx', width/2 + Math.cos(angle) * radius * userValue)
          .attr('cy', height/2 + Math.sin(angle) * radius * userValue)
          .attr('r', 4)
          .attr('fill', '#1DB954')

        // Draw match point
        svg.append('circle')
          .attr('cx', width/2 + Math.cos(angle) * radius * matchValue)
          .attr('cy', height/2 + Math.sin(angle) * radius * matchValue)
          .attr('r', 4)
          .attr('fill', '#4A5568')

        // Add feature label
        svg.append('text')
          .attr('x', width/2 + Math.cos(angle) * (radius + 20))
          .attr('y', height/2 + Math.sin(angle) * (radius + 20))
          .attr('text-anchor', 'middle')
          .attr('fill', '#A0AEC0')
          .text(feature.charAt(0).toUpperCase() + feature.slice(1))
      })
    }

    createMusicalDNA()
    createMoodProfile()

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
            <Text fontWeight="bold">Musical Compatibility</Text>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm">Compatibility Score</Text>
              <Progress
                value={compatibilityScore * 100}
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
