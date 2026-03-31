import Link from 'next/link'
import Header from '@/components/Header'
import styles from './page.module.css'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Terms</h1>
        <p className={styles.subtitle}>Platform Install &amp; Admin Transfer Agreement</p>
        <p className={styles.updated}>Last updated: February 10, 2026</p>

        <div className={styles.section}>
          <h2>Service Agreement</h2>
          <p>Platform Install &amp; Admin Transfer Agreement</p>
          <p>
            This Platform Install &amp; Admin Transfer Agreement (&quot;Agreement&quot;) is entered into by and between Lenore, Inc. (&quot;Provider&quot;) and the individual or entity purchasing installation services (&quot;Client&quot;). Provider and Client may be referred to individually as a &quot;Party&quot; and collectively as the &quot;Parties.&quot;
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 1. Covered Installs &amp; Scope of Work (Platform Setup Only)</h2>
          <p>This Agreement applies to all Provider installation offerings purchased by Client, including:</p>
          <ul>
            <li>Tax Monitor Setup</li>
            <li>VA Agency Setup</li>
            <li>VA Starter Track Setup</li>
          </ul>
          <p>
            Provider will perform a fixed-scope installation and configuration of a third-party software platform selected by Client (the &quot;Install&quot;).
          </p>
          <p>
            The Install may include platform configuration, portal or workspace setup, workflows, projects, permissions, templates, and related technical enablement.
          </p>
          <p>
            Provider&apos;s services are limited strictly to system setup. No ongoing operations, management, monitoring, staffing, or advisory services are included unless expressly agreed to in writing.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 2. No Professional or Regulated Services</h2>
          <p>
            Client acknowledges that Provider does not provide tax, legal, accounting, financial, compliance, employment, or regulated professional services under this Agreement.
          </p>
          <p>
            Any industry-specific wording (including tax, virtual assistant, agency, operations, or compliance language) appearing in templates, examples, or workflows is structural or illustrative only and does not constitute advice, representation, or a professional engagement.
          </p>
          <p>
            Client remains solely responsible for all services offered to third parties using the installed system.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 3. Client Responsibilities</h2>
          <ul>
            <li>Provide timely access, credentials, approvals, and information required to complete the Install.</li>
            <li>Review and approve all configurations prior to use.</li>
            <li>Ensure that all workflows, messaging, permissions, and use of the platform comply with Client&apos;s internal policies, contracts, and applicable laws.</li>
            <li>Maintain and pay for all third-party software, subscriptions, licenses, and integrations required for continued platform use.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Section 4. Super Admin Access &amp; Transfer</h2>
          <p>
            To perform the Install, Provider may require temporary elevated access, including Super Admin or equivalent permissions.
          </p>
          <p>
            Client authorizes Provider to access the platform solely for purposes of completing the Install. Upon completion:
          </p>
          <ul>
            <li>Client will be designated as the primary Super Admin and system owner.</li>
            <li>Client assumes full responsibility for credential security, user access, and permission management.</li>
            <li>Provider has no control over and no responsibility for actions taken after Super Admin control is transferred or returned.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Section 5. Third-Party Platform Billing &amp; Ownership</h2>
          <p>
            Client understands that the installed platform is operated by a third-party provider independent of Provider.
          </p>
          <p>
            If Provider initially provisions the platform during installation, third-party billing may begin after the Install is completed, including charges that may appear approximately thirty (30) days later depending on the platform&apos;s billing cycle.
          </p>
          <p>
            Once Client is the Super Admin or billing party on file, Client is solely responsible for all platform fees, renewals, add-ons, overages, subscriptions, and related charges.
          </p>
          <p>
            Provider is not responsible for pricing changes, billing disputes, service interruptions, account suspensions, feature changes, or any actions taken by the third-party platform provider.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 6. Acceptance of Deliverables</h2>
          <p>The Install is deemed accepted upon the earlier of:</p>
          <ul>
            <li>Provider marking the Install complete in writing (including via task or portal completion), or</li>
            <li>Client using the installed system in production.</li>
          </ul>
          <p>
            Any changes, enhancements, or rework requested after acceptance are outside scope and require a separate written agreement.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 7. Fees, Payment, and Refunds</h2>
          <p>Client agrees to pay the one-time installation fee presented at checkout.</p>
          <p>
            Unless otherwise stated in writing, fees are non-refundable once work has commenced due to the nature of digital configuration, provisioning, and access enablement.
          </p>
          <p>
            For refunds and purchase policy details, see our <Link href="/legal/refund" style={{ color: 'var(--accent)' }}>Refund Policy</Link>.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 8. Privacy Policy (Data Handling)</h2>
          <p>This section describes how Provider may access and handle Client information during the Install.</p>

          <h3>A. Information Provider May Receive</h3>
          <p>
            Provider may receive or have access to Client-provided information such as administrative credentials, user lists, business contact information, workflows, templates, messages, portal content, files, and configuration data. Depending on Client&apos;s use of the platform, Provider may also incidentally view information uploaded by Client or Client&apos;s end users.
          </p>

          <h3>B. Purpose of Access</h3>
          <p>
            Provider will access and use information only as reasonably necessary to complete the Install, perform troubleshooting, verify deliverables, and transfer administrative control back to Client.
          </p>

          <h3>C. Data Minimization</h3>
          <p>
            Provider will make reasonable efforts to minimize access to content not required for installation. Client is encouraged to avoid uploading sensitive information into the platform during the Install unless it is necessary for testing or configuration.
          </p>

          <h3>D. Confidentiality &amp; Security</h3>
          <p>
            Provider will maintain commercially reasonable administrative, technical, and organizational safeguards to protect information accessed during the Install. Client remains responsible for selecting secure credentials, enabling platform security settings, and managing user permissions after transfer.
          </p>

          <h3>E. Credential Handling</h3>
          <p>
            Client may provide credentials or temporary access links to enable installation. Client may revoke Provider access at any time; however, doing so may pause or prevent completion. After completion, Client should rotate any temporary passwords, revoke temporary invites, and confirm Super Admin ownership.
          </p>

          <h3>F. Third-Party Platforms</h3>
          <p>
            The platform is a third-party service. Provider does not control and is not responsible for the platform provider&apos;s privacy practices, security controls, data processing, retention, or hosting. Client is responsible for reviewing and accepting the third-party platform&apos;s privacy policy and terms.
          </p>

          <h3>G. Data Retention</h3>
          <p>
            Provider does not intend to store Client data outside the platform except as necessary for installation documentation, support records, invoicing, or proof of delivery. Any retained information will be limited and kept only for as long as reasonably necessary for business and legal purposes.
          </p>

          <h3>H. Client Requests</h3>
          <p>
            Client may request deletion of Provider-held installation artifacts or documentation that contain Client information, to the extent Provider is not required to retain the information for legal, tax, accounting, dispute, or recordkeeping obligations.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 9. No Guarantees</h2>
          <p>
            Provider does not guarantee outcomes, revenue, efficiency, compliance results, hiring results, client acquisition, or operational performance.
          </p>
          <p>
            Provider&apos;s obligation is limited solely to delivering the Install as described in this Agreement.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Provider will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, revenue, data, goodwill, or business interruption, arising out of or related to this Agreement, the Install, or Client&apos;s use of the platform.
          </p>
          <p>
            Provider&apos;s total aggregate liability under this Agreement will not exceed the amount actually paid by Client to Provider for the Install.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 11. Indemnification</h2>
          <p>Client agrees to indemnify and hold harmless Provider from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:</p>
          <ul>
            <li>Client&apos;s content, workflows, messaging, or representations made using the installed system,</li>
            <li>Client&apos;s services or offerings to third parties,</li>
            <li>Client&apos;s misuse of the platform,</li>
            <li>Client&apos;s breach of this Agreement, or</li>
            <li>Client&apos;s violation of applicable laws or third-party rights.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Section 12. Confidentiality</h2>
          <p>
            Each Party agrees to keep confidential any non-public business, technical, or operational information disclosed in connection with the Install and to use such information solely to perform obligations under this Agreement.
          </p>
          <p>
            This obligation does not apply to information that is public, independently developed, or rightfully obtained without restriction.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 13. Intellectual Property &amp; License</h2>
          <p>
            Provider retains all rights in its templates, workflows, configuration methods, documentation, and systems used to perform the Install.
          </p>
          <p>
            Client receives a non-exclusive right to use the delivered configuration for Client&apos;s internal business purposes. Client may not resell, sublicense, or redistribute Provider&apos;s proprietary materials without written authorization.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 14. Termination</h2>
          <p>
            Either Party may terminate this Agreement if the other Party materially breaches and fails to cure within a reasonable time after written notice.
          </p>
          <p>
            If termination occurs after work has commenced, Client remains responsible for fees incurred and committed costs.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 15. Governing Law &amp; Venue</h2>
          <p>
            This Agreement is governed by the laws of the jurisdiction in which Provider operates, without regard to conflict-of-law principles.
          </p>
          <p>
            Any dispute will be resolved in the courts located in Provider&apos;s local jurisdiction unless the Parties agree in writing to binding arbitration.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Section 16. Entire Agreement</h2>
          <p>
            This Agreement constitutes the entire agreement between the Parties regarding platform installation services and supersedes all prior discussions or representations.
          </p>
          <p>
            Any amendment must be in writing and accepted by both Parties.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Electronic Acceptance</h2>
          <p>
            By completing checkout or electronically accepting this Agreement, Client acknowledges that they have read, understood, and agreed to be bound by these terms.
          </p>
        </div>
      </main>
    </>
  )
}
