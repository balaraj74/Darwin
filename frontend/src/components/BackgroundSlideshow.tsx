'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const BG_IMAGES = [
  '/bg1.png',
  '/bg2.png',
  '/bg3.png'
]

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BG_IMAGES.length)
    }, 6000) // Change image every 6 seconds
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Image
            src={BG_IMAGES[currentIndex]}
            alt="AI Background"
            fill
            priority
            style={{ objectFit: 'cover', opacity: 0.6 }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
