import { useState, useEffect, useRef } from 'react'
import { REMINDERS } from '../utils/reminders'

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function useReminders(intervalMs = 4 * 60 * 1000) {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(true)
  const pool = useRef([])
  const idx  = useRef(0)

  function next() {
    if (idx.current >= pool.current.length) {
      pool.current = shuffle(REMINDERS)
      idx.current  = 0
    }
    return pool.current[idx.current++]
  }

  useEffect(() => {
    pool.current = shuffle(REMINDERS)
    idx.current  = 0
    setText(next())
    setVisible(true)

    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setText(next())
        setVisible(true)
      }, 300)
    }, intervalMs)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])

  return { text, visible }
}
