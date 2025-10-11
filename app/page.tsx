'use client'; // <-- ADD THIS LINE AT THE VERY TOP

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
      <header>
        <h1>Welcome to the Trip-Aware Co-Pilot</h1>
        <p style={{marginTop: '20px'}}>Your intelligent assistant for safer, smarter, and more enjoyable driving.</p>
      </header>
      <div style={{ marginTop: '50px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <Link href="/dashboard" className="cta-button">Go to Dashboard</Link>
        <Link href="/sign-in" className="cta-button secondary">Sign In</Link>
        <Link href="/sign-up" className="cta-button secondary">Sign Up</Link>
      </div>

      <style jsx>{`
        .cta-button {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.2s;
        }
        .cta-button.secondary {
          background-color: var(--input-background);
          color: var(--primary-color);
          border: 1px solid var(--primary-color);
        }
        .cta-button:not(.secondary) {
          background-color: var(--primary-color);
          color: #000;
        }
      `}</style>
    </main>
  );
}
