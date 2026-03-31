"use client";

import { useEffect, useCallback } from "react";
import styles from "./SupportModal.module.css";

export const SUPPORT_LINKS = {
  tttmp: {
    support: "tax-monitor-pro/tax-tools-tax-monitor-support",
  },
};

interface SupportModalProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

export default function SupportModal({ slug, open, onClose }: SupportModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const calUrl = `https://cal.com/${slug}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Close support modal"
        >
          &times;
        </button>
        <iframe
          src={`${calUrl}?embed=true`}
          className={styles.iframe}
          title="Schedule Support"
        />
      </div>
    </div>
  );
}

interface SupportButtonProps {
  slug?: string;
  label?: string;
  className?: string;
}

export function SupportButton({
  slug = SUPPORT_LINKS.tttmp.support,
  label = "Schedule Support",
  className,
}: SupportButtonProps) {
  const handleClick = () => {
    const calUrl = `https://cal.com/${slug}`;
    window.open(calUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      className={`${styles.supportButton} ${className || ""}`}
      onClick={handleClick}
      type="button"
    >
      {label}
    </button>
  );
}
