import styles from "./LegalPage.module.css";

const PLATFORM = {
  name: "Tax Tools Arcade",
  domain: "taxtools.taxmonitor.pro",
  email: "legal@taxmonitor.pro",
  accent: "#f59e0b",
  entity: "Lenore, Inc.",
  effectiveDate: "March 31, 2026",
};

type LegalType = "privacy" | "terms" | "refunds";

interface LegalPageProps {
  type: LegalType;
}

function getTitle(type: LegalType): string {
  switch (type) {
    case "privacy":
      return "Privacy Policy";
    case "terms":
      return "Terms of Service";
    case "refunds":
      return "Refund Policy";
  }
}

function PrivacyContent() {
  return (
    <>
      <section className={styles.section}>
        <h2>1. Information We Collect</h2>
        <p>
          When you use {PLATFORM.name}, we collect information you provide
          directly, such as your email address when creating an account. We also
          collect usage data automatically, including pages visited, games
          played, and interaction timestamps.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. How We Use Your Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process transactions via Stripe</li>
          <li>Send service-related communications</li>
          <li>Improve and personalize user experience</li>
          <li>Detect and prevent fraud or abuse</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Third-Party Services</h2>
        <p>
          We use the following third-party processors:
        </p>
        <ul>
          <li><strong>Stripe</strong> for payment processing</li>
          <li><strong>Cloudflare</strong> for hosting and content delivery</li>
          <li><strong>Cal.com</strong> for scheduling support sessions</li>
        </ul>
        <p>
          Each processor operates under its own privacy policy. We do not sell
          your personal information to third parties.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is
          active or as needed to provide services. You may request deletion of
          your account and associated data by contacting{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Security</h2>
        <p>
          We implement industry-standard security measures to protect your
          information, including encryption in transit and at rest. However, no
          method of transmission over the Internet is 100% secure.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by posting the updated policy on this page
          with a revised effective date.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Contact</h2>
        <p>
          For privacy-related inquiries, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a>.
        </p>
      </section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <section className={styles.section}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {PLATFORM.name} ({PLATFORM.domain}), you agree
          to be bound by these Terms of Service. If you do not agree, do not
          use the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Description of Service</h2>
        <p>
          {PLATFORM.name} provides gamified tax education tools. Users purchase
          tokens via Stripe to play educational games. Tokens are digital
          credits with no cash value.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Accounts</h2>
        <p>
          You must provide a valid email address to create an account. You are
          responsible for maintaining the security of your account credentials.
          {PLATFORM.entity} is not liable for unauthorized access to your
          account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Tokens and Payments</h2>
        <p>
          Tokens are purchased through Stripe. All sales are final. Tokens are
          non-transferable and have no monetary value outside the platform.
          Tokens are non-refundable once issued to your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the platform for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the service</li>
          <li>Interfere with or disrupt the platform</li>
          <li>Reverse-engineer or decompile any part of the service</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>6. Limitation of Liability</h2>
        <p>
          {PLATFORM.entity} provides {PLATFORM.name} &ldquo;as is&rdquo;
          without warranties of any kind. In no event shall {PLATFORM.entity} be
          liable for any indirect, incidental, or consequential damages.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Dispute Resolution</h2>
        <p>
          Any disputes arising from these Terms shall be resolved through
          binding arbitration in accordance with the laws of the State of
          Delaware. You waive any right to participate in class-action lawsuits
          or class-wide arbitration.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware,
          without regard to conflict of law principles.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Continued use
          of the platform after changes constitutes acceptance of the modified
          Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Contact</h2>
        <p>
          Questions about these Terms? Contact{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a>.
        </p>
      </section>
    </>
  );
}

function RefundsContent() {
  return (
    <>
      <section className={styles.section}>
        <h2>1. Token Purchases</h2>
        <p>
          All token purchases on {PLATFORM.name} are processed securely through
          Stripe. Upon successful payment, tokens are immediately credited to
          your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Non-Refundable Tokens</h2>
        <p>
          Tokens are non-refundable once issued to your account. Because tokens
          are digital credits consumed instantly upon use, we cannot reverse
          token issuance after purchase.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Payment Errors</h2>
        <p>
          If you experience a payment error (e.g., duplicate charge, incorrect
          amount), contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a> within 7
          days of the transaction. We will investigate and issue a refund if the
          error is confirmed.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Failed Deliveries</h2>
        <p>
          If your payment was processed but tokens were not credited to your
          account, contact us immediately. We will verify the transaction with
          Stripe and credit the appropriate tokens or issue a full refund.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Chargebacks</h2>
        <p>
          Filing a chargeback with your bank without first contacting us may
          result in account suspension. We encourage you to reach out to{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a> to resolve
          any billing concerns before initiating a dispute.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Contact</h2>
        <p>
          For refund inquiries, email{" "}
          <a href={`mailto:${PLATFORM.email}`}>{PLATFORM.email}</a>.
        </p>
      </section>
    </>
  );
}

export default function LegalPage({ type }: LegalPageProps) {
  const title = getTitle(type);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.meta}>
            Effective: {PLATFORM.effectiveDate} &middot; {PLATFORM.entity}
          </p>
        </header>

        <div className={styles.content}>
          {type === "privacy" && <PrivacyContent />}
          {type === "terms" && <TermsContent />}
          {type === "refunds" && <RefundsContent />}
        </div>
      </div>
    </main>
  );
}
