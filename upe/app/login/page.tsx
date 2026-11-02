'use client';

import { signIn } from 'next-auth/react';
import { SpecSheet } from '../components/spec-sheet';

const EXAMPLE_IDEA = 'Create a website for my bakery';

const EXAMPLE_PROMPT = `[ROLE] Senior front-end engineer who builds marketing sites for small businesses.

[CONTEXT] A one-page site for a neighbourhood bakery. Success means visitors find the opening hours and order for pickup.

[TASK] Build a responsive one-page site with a hero, a menu of six seasonal loaves, opening hours and a pickup form. Show each loaf with its name, price and baking day. Place the form directly under the menu. Keep the language warm and unfussy.

[CONSTRAINTS]
- Next.js and Tailwind only
- No stock photography
- No carousels or modals

[OUTPUT FORMAT] Output only the complete, functional code. No explanations or deployment notes.`;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  return (
    <div className="login">
      <main className="login-main">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="brand-mark" />
          AI Prompt Engineer
        </div>

        <div className="login-pitch">
          <h1 className="login-title">Turn a rough idea into a prompt for Cursor, v0, ChatGPT or Claude</h1>
          <p className="login-text">
            A short chat asks only what’s missing, then writes a master prompt you can copy and paste.
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            id="google-sign-in-button"
            className="google-button"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
      </main>

      <aside className="login-example" aria-label="Example result">
        <p className="login-idea">
          <span aria-hidden="true">&gt;</span>
          {EXAMPLE_IDEA}
        </p>
        <SpecSheet text={EXAMPLE_PROMPT} aside={<span className="spec-meta">Example</span>} />
      </aside>
    </div>
  );
}
