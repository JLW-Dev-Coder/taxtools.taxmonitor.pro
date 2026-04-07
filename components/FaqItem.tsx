'use client'
import { useState } from 'react'
import styles from './FaqItem.module.css'

export default function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.item}>
      <button className={styles.toggle} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <svg
          className={`${styles.icon} ${open ? styles.iconOpen : ''}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className={styles.answer}>{answer}</div>}
    </div>
  )
}
