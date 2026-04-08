'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailReadOnly, setEmailReadOnly] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketId, setTicketId] = useState('')

  useEffect(() => {
    api.getSession()
      .then((data) => {
        setEmail(data.session.email)
        setEmailReadOnly(true)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit() {
    setError('')
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.')
      return
    }

    setLoading(true)
    try {
      const data = await api.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        priority,
        category: 'support',
      }) as { ticket_id: string }
      setTicketId(data.ticket_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Contact Support</h1>
        <p className={styles.subtitle}>
          Have a question or need help? Send us a message.
        </p>

        <div className={styles.layout}>
          {ticketId ? (
            <div className={styles.success}>
              <p className={styles.successTitle}>Ticket submitted</p>
              <p className={styles.ticketId}>
                Your ticket ID is {ticketId} — save this for reference
              </p>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                We&apos;ll get back to you based on your selected priority.
              </p>
            </div>
          ) : (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={emailReadOnly}
                  placeholder="you@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Subject</label>
                <input
                  className={styles.input}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Message</label>
                <textarea
                  className={styles.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you need help with…"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Priority</label>
                <select
                  className={styles.select}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          )}

          <div className={styles.infoPanel}>
            <h3 className={styles.infoPanelTitle}>Response Times</h3>

            <div className={styles.responseTime}>
              <h4>Expected response by priority</h4>
              <div className={styles.responseItem}>
                <span className={styles.responseLabel}>Normal</span>
                <span>Within 48 hours</span>
              </div>
              <div className={styles.responseItem}>
                <span className={styles.responseLabel}>High</span>
                <span>Within 24 hours</span>
              </div>
              <div className={styles.responseItem}>
                <span className={styles.responseLabel}>Critical</span>
                <span>Within 4 hours</span>
              </div>
            </div>

            <div className={styles.fallback}>
              You can also email us directly at
              <span className={styles.fallbackEmail}>support@taxmonitor.pro</span>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
