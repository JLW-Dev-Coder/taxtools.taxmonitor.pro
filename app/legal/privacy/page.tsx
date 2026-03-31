import Header from '@/components/Header'
import styles from './page.module.css'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: February 10, 2026</p>

        <div className={styles.section}>
          <p>
            This Privacy Policy explains how Lenore, Inc. (&quot;Provider&quot;) may access and handle Client information during platform installs.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Install Data Handling</h2>
          <p>
            Provider may access Client information only as reasonably necessary to complete installation, configuration, troubleshooting, verification of deliverables, and administrative transfer. Provider does not sell Client data.
          </p>
        </div>

        <div className={styles.section}>
          <h2>A. Information Provider May Receive</h2>
          <p>
            Provider may receive or have access to Client-provided information such as administrative credentials, user lists, business contact information, workflows, templates, messages, portal content, files, and configuration data. Depending on Client&apos;s use of the platform, Provider may also incidentally view information uploaded by Client or Client&apos;s end users.
          </p>
        </div>

        <div className={styles.section}>
          <h2>B. Purpose of Access</h2>
          <p>
            Provider will access and use information only as reasonably necessary to complete the Install, perform troubleshooting, verify deliverables, and transfer administrative control back to Client.
          </p>
        </div>

        <div className={styles.section}>
          <h2>C. Data Minimization</h2>
          <p>
            Provider will make reasonable efforts to minimize access to content not required for installation. Client is encouraged to avoid uploading sensitive information into the platform during the Install unless it is necessary for testing or configuration.
          </p>
        </div>

        <div className={styles.section}>
          <h2>D. Confidentiality &amp; Security</h2>
          <p>
            Provider will maintain commercially reasonable administrative, technical, and organizational safeguards to protect information accessed during the Install. Client remains responsible for selecting secure credentials, enabling platform security settings, and managing user permissions after transfer.
          </p>
        </div>

        <div className={styles.section}>
          <h2>E. Credential Handling</h2>
          <p>
            Client may provide credentials or temporary access links to enable installation. Client may revoke Provider access at any time; however, doing so may pause or prevent completion. After completion, Client should rotate any temporary passwords, revoke temporary invites, and confirm Super Admin ownership.
          </p>
        </div>

        <div className={styles.section}>
          <h2>F. Third-Party Platforms</h2>
          <p>
            The platform is a third-party service. Provider does not control and is not responsible for the platform provider&apos;s privacy practices, security controls, data processing, retention, or hosting. Client is responsible for reviewing and accepting the third-party platform&apos;s privacy policy and terms.
          </p>
        </div>

        <div className={styles.section}>
          <h2>G. Data Retention</h2>
          <p>
            Provider does not intend to store Client data outside the platform except as necessary for installation documentation, support records, invoicing, or proof of delivery. Any retained information will be limited and kept only for as long as reasonably necessary for business and legal purposes.
          </p>
        </div>

        <div className={styles.section}>
          <h2>H. Client Requests</h2>
          <p>
            Client may request deletion of Provider-held installation artifacts or documentation that contain Client information, to the extent Provider is not required to retain the information for legal, tax, accounting, dispute, or recordkeeping obligations.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Contact</h2>
          <p>
            For questions regarding this Privacy Policy or Provider&apos;s data handling practices, contact Lenore, Inc. through official business channels.
          </p>
        </div>
      </main>
    </>
  )
}
