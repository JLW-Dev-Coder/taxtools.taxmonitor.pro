'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import styles from './page.module.css'

export default function Form8821Page() {
  const [membership, setMembership] = useState<string | null | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  // Form fields
  const [taxpayerName, setTaxpayerName] = useState('')
  const [taxpayerTin, setTaxpayerTin] = useState('')
  const [taxpayerAddress, setTaxpayerAddress] = useState('')
  const [designeeName, setDesigneeName] = useState('')
  const [designeeAddress, setDesigneeAddress] = useState('')
  const [taxInfoType, setTaxInfoType] = useState('Income')
  const [taxYears, setTaxYears] = useState('')

  useEffect(() => {
    api.getSession()
      .then((data) => setMembership(data.user.membership ?? null))
      .catch(() => setMembership(null))
  }, [])

  const isPaid = membership && membership !== 'free'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await fetch('https://api.virtuallaunch.pro/v1/tttmp/forms/8821', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxpayer_name: taxpayerName,
          taxpayer_tin: taxpayerTin,
          taxpayer_address: taxpayerAddress,
          designee_name: designeeName,
          designee_address: designeeAddress,
          tax_information_type: taxInfoType,
          tax_years: taxYears,
        }),
      }).then((res) => {
        if (!res.ok) throw new Error(`Submission failed (${res.status})`)
      })
      setSubmitted(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Form 8821</h1>
        <p className={styles.subtitle}>
          Tax Information Authorization
        </p>

        {membership === undefined ? (
          <p className={styles.loading}>Checking subscription…</p>
        ) : !isPaid ? (
          <div className={styles.gate}>
            <div className={styles.gateIcon}>🔒</div>
            <h2 className={styles.gateTitle}>Paid Subscription Required</h2>
            <p className={styles.gateMessage}>
              An active paid subscription is required to use form tools.
              Form 8821 and all form tools are free with any paid membership.
            </p>
            <Link href="/pricing" className={styles.gateLink}>
              View Plans
            </Link>
          </div>
        ) : submitted ? (
          <div className={styles.success}>
            Form 8821 submitted successfully. You will receive a confirmation shortly.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <p className={styles.sectionNote}>Part I — Taxpayer Information</p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="taxpayer-name">Taxpayer Name</label>
              <input
                id="taxpayer-name"
                className={styles.input}
                type="text"
                required
                value={taxpayerName}
                onChange={(e) => setTaxpayerName(e.target.value)}
                placeholder="Full legal name or business name"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="taxpayer-tin">SSN / EIN</label>
                <input
                  id="taxpayer-tin"
                  className={styles.input}
                  type="text"
                  required
                  value={taxpayerTin}
                  onChange={(e) => setTaxpayerTin(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tax-info-type">Tax Information Type</label>
                <select
                  id="tax-info-type"
                  className={styles.select}
                  value={taxInfoType}
                  onChange={(e) => setTaxInfoType(e.target.value)}
                >
                  <option>Income</option>
                  <option>Employment</option>
                  <option>Excise</option>
                  <option>Estate</option>
                  <option>Gift</option>
                  <option>Civil Penalty</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="taxpayer-address">Taxpayer Address</label>
              <input
                id="taxpayer-address"
                className={styles.input}
                type="text"
                required
                value={taxpayerAddress}
                onChange={(e) => setTaxpayerAddress(e.target.value)}
                placeholder="Street, City, State, ZIP"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="tax-years">Tax Years / Periods</label>
              <input
                id="tax-years"
                className={styles.input}
                type="text"
                required
                value={taxYears}
                onChange={(e) => setTaxYears(e.target.value)}
                placeholder="e.g. 2022, 2023"
              />
            </div>

            <p className={styles.sectionNote}>Part II — Designee Information</p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="designee-name">Designee Name</label>
              <input
                id="designee-name"
                className={styles.input}
                type="text"
                required
                value={designeeName}
                onChange={(e) => setDesigneeName(e.target.value)}
                placeholder="Full name of authorized designee"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="designee-address">Designee Address</label>
              <input
                id="designee-address"
                className={styles.input}
                type="text"
                required
                value={designeeAddress}
                onChange={(e) => setDesigneeAddress(e.target.value)}
                placeholder="Street, City, State, ZIP"
              />
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Form 8821'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}
