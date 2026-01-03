'use client';

import { useState, useRef } from 'react';
import AdminPanel from './AdminPanel';
import FloatingFeedback from './contact/FloatingFeedback';

export default function PageWrapper({ children }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const handleFooterClick = () => {
    tapCountRef.current += 1;

    // Reset tap count after 2 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);

    // Open admin panel after 10 taps
    if (tapCountRef.current === 10) {
      setIsAdminOpen(true);
      tapCountRef.current = 0;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    }
  };

  return (
    <>
      <div onClick={(e) => {
        // Only activate on footer click
        if (e.target.closest('footer')) {
          handleFooterClick();
        }
      }}>
        {children}
      </div>
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <FloatingFeedback />
    </>
  );
}
