import { useEffect, useRef } from 'react'
import { Box } from '@chakra-ui/react'
import { motion, useAnimation } from 'framer-motion'

interface MusicVisualizerProps {
  audioData: {
    frequency: Float32Array
    waveform: Float32Array
  }
  isPlaying: boolean
  mood: {
    energy: number
    valence: number
    danceability: number
  }
}

const MotionBox = motion(Box)

export default function MusicVisualizer({ audioData, isPlaying, mood }: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useAnimation()
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    
    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Color palette based on mood
    const getColorPalette = () => {
      const energy = mood.energy
      const valence = mood.valence
      
      // Base colors for different moods
      const happyEnergetic = ['#1DB954', '#1ED760', '#FFD700', '#FF8C00']
      const happyCalm = ['#1DB954', '#90EE90', '#98FB98', '#7FFFD4']
      const sadEnergetic = ['#4A90E2', '#5C6BC0', '#7986CB', '#9575CD']
      const sadCalm = ['#4A5568', '#718096', '#A0AEC0', '#CBD5E0']
      
      if (valence > 0.5 && energy > 0.5) return happyEnergetic
      if (valence > 0.5 && energy <= 0.5) return happyCalm
      if (valence <= 0.5 && energy > 0.5) return sadEnergetic
      return sadCalm
    }

    const colors = getColorPalette()
    
    // Visualization styles based on mood
    const particleCount = Math.floor(mood.energy * 100) + 50
    const particleSize = mood.danceability * 5 + 2
    const particleSpeed = mood.energy * 2 + 0.5
    
    // Particle system
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * particleSize + 1
        this.speedX = (Math.random() - 0.5) * particleSpeed
        this.speedY = (Math.random() - 0.5) * particleSpeed
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }
      
      update(frequency: number) {
        this.x += this.speedX * (1 + frequency * 0.5)
        this.y += this.speedY * (1 + frequency * 0.5)
        
        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }
      
      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }
    
    const particles = Array.from({ length: particleCount }, () => new Particle())
    
    // Waveform visualization
    const drawWaveform = () => {
      if (!ctx) return
      
      ctx.lineWidth = 2
      ctx.strokeStyle = colors[0]
      ctx.beginPath()
      
      const sliceWidth = canvas.width / audioData.waveform.length
      let x = 0
      
      for (let i = 0; i < audioData.waveform.length; i++) {
        const v = audioData.waveform[i] * 200
        const y = (canvas.height / 2) + v
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    
    // Frequency visualization
    const drawFrequencyBars = () => {
      if (!ctx) return
      
      const barWidth = canvas.width / audioData.frequency.length
      let x = 0
      
      for (let i = 0; i < audioData.frequency.length; i++) {
        const barHeight = audioData.frequency[i] * canvas.height * 0.5
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
        gradient.addColorStop(0, colors[0])
        gradient.addColorStop(1, colors[colors.length - 1])
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        
        x += barWidth
      }
    }
    
    // Animation loop
    const animate = () => {
      if (!ctx) return
      
      ctx.fillStyle = 'rgba(18, 18, 18, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (isPlaying) {
        // Update and draw particles
        particles.forEach((particle, i) => {
          const frequencyIndex = Math.floor(i / particles.length * audioData.frequency.length)
          particle.update(audioData.frequency[frequencyIndex])
          particle.draw()
        })
        
        // Draw audio visualizations
        drawWaveform()
        drawFrequencyBars()
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [audioData, isPlaying, mood])

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={0}
      overflow="hidden"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: isPlaying ? 0.8 : 0.3,
          transition: 'opacity 0.3s ease',
        }}
      />
    </Box>
  )
}
