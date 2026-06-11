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
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.28
        }}
      >
        <source src="/bgvideo.mp4" type="video/mp4" />
      </video>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,12,0.7) 0%, rgba(10,10,12,0.4) 100%)' }} />
    </div>
  )
}
