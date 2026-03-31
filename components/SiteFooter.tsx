import Link from "next/link";
import styles from "./SiteFooter.module.css";

const PLATFORM_LINKS = [
  { label: "About", href: "/about-games" },
  { label: "Games", href: "/games" },
  { label: "Pricing", href: "/pricing" },
  { label: "Account", href: "/account" },
];

const RESOURCE_LINKS = [
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Affiliate Program", href: "/affiliate" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
];

const ECOSYSTEM_LINKS = [
  { label: "Tax Monitor Pro", href: "https://taxmonitor.pro" },
  { label: "Tax Tools Arcade", href: "https://taxtools.taxmonitor.pro" },
  { label: "StreamForge", href: "https://streamforge.pro" },
  { label: "StreamForge Tools", href: "https://tools.streamforge.pro" },
  { label: "VLP Hub", href: "https://virtuallaunch.pro" },
  { label: "VLP API", href: "https://api.virtuallaunch.pro" },
  { label: "Lenore, Inc.", href: "https://lenore.inc" },
  { label: "VLP Docs", href: "https://docs.virtuallaunch.pro" },
];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <ul className={styles.list}>
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Resources</h4>
            <ul className={styles.list}>
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <ul className={styles.list}>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>VLP Ecosystem</h4>
            <ul className={styles.list}>
              {ECOSYSTEM_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.affiliate}>
          <Link href="/affiliate" className={styles.affiliateLink}>
            Earn 20% — Affiliate Program
          </Link>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; 2026 Lenore, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
