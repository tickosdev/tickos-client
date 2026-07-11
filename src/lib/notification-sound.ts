// =====================================================
// Sonido de notificacion para tickets nuevos.
// Copia 1:1 del sonido original de tickos-core
// (src/lib/notification-sound.ts): dos tonos 800Hz→1000Hz
// generados con Web Audio API.
// =====================================================

// Create audio context only once
let audioContext: AudioContext | null = null

const getAudioContext = async () => {
  if (typeof window === 'undefined') {
    return null
  }

  // @ts-expect-error - AudioContext exists in browser
  const AudioContextClass = window.AudioContext || window.webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioContextClass()
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  return audioContext
}

/**
 * Initialize audio context on first user interaction
 * This is required for browsers that block autoplay
 */
export const initializeAudioContext = async () => {
  try {
    await getAudioContext()
  } catch (error) {
    console.debug('Could not initialize audio context:', error)
  }
}

/**
 * Play a subtle notification sound for new tickets
 * Uses Web Audio API to generate a pleasant two-tone notification
 */
export const playNotificationSound = async () => {
  try {
    const context = await getAudioContext()

    if (!context) {
      console.debug('AudioContext not available')
      return
    }

    const now = context.currentTime

    // Create oscillator for the tone
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // Configure sound - Pleasant two-tone notification (similar to iOS/macOS)
    oscillator.type = 'sine'

    // First tone: 800Hz for 100ms
    oscillator.frequency.setValueAtTime(800, now)
    // Second tone: 1000Hz at 100ms mark
    oscillator.frequency.setValueAtTime(1000, now + 0.1)

    // Volume envelope - quick fade in, sustain, quick fade out
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02) // Quick fade in
    gainNode.gain.setValueAtTime(0.25, now + 0.15) // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + 0.25) // Fade out

    // Start and stop
    oscillator.start(now)
    oscillator.stop(now + 0.25)

    // Cleanup
    oscillator.onended = () => {
      gainNode.disconnect()
      oscillator.disconnect()
    }
  } catch (error) {
    console.warn('Could not play notification sound:', error)
  }
}
