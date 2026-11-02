'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { SpecSheet } from './components/spec-sheet';

// The chat API writes this exact line before a master prompt, and also uses it to deduct a credit.
const MASTER_PROMPT_TRIGGER = '✅ Here is your master prompt:';

const Icon = ({ children }: { children: ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
    {children}
  </svg>
);

const UserIcon = () => (
  <Icon>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const SendIcon = () => (
  <Icon>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </Icon>
);

const CopyIcon = () => (
  <Icon>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

const SignOutIcon = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

const WorkingCaret = () => (
  <span className="working-caret" role="status" aria-label="Writing a reply">
    _
  </span>
);

const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Icon>
);

const getMessageText = (message: any): string => {
  if (message?.parts) {
    return message.parts.map((part: any) => (part.type === 'text' ? part.text : '')).join('');
  }
  return message?.content || message?.text || '';
};

// The chat API sends failures as JSON, which useChat passes along as the error's message.
const getChatErrorKind = (error: Error): 'credits' | 'session' | 'other' => {
  try {
    const serverError = JSON.parse(error.message).error;
    if (serverError === 'You have run out of credits') return 'credits';
    if (serverError === 'Unauthorized') return 'session';
  } catch {
    // Not JSON, so it isn't one of the API's own responses.
  }
  return 'other';
};

export default function Chat() {
  const { data: session } = useSession();
  const [input, setInput] = useState('');
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const { messages, sendMessage, append, regenerate, status, error } = useChat() as any;
  const isLoading = status === 'submitted' || status === 'streaming';
  const userEmail = session?.user?.email;
  const chatErrorKind = error ? getChatErrorKind(error) : null;

  // Load credits on arrival and again after each reply, since a finished master prompt uses one.
  useEffect(() => {
    if (!userEmail || status === 'submitted' || status === 'streaming') return;
    let isCurrent = true;
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => {
        if (isCurrent && data.credits !== undefined) {
          setCredits(data.credits);
        }
      })
      .catch(err => console.error("Failed to fetch credits", err));
    return () => {
      isCurrent = false;
    };
  }, [userEmail, status]);

  useEffect(() => {
    if (!showMenu) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, error]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

      if (newWidth > 45 && newWidth < 65) {
        setLeftWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setFinalPrompt(null);
      return;
    }
    const lastAssistantMessage = [...messages].reverse().find((m: any) => m.role === 'assistant');
    if (lastAssistantMessage) {
      const textContent = getMessageText(lastAssistantMessage);
      if (textContent.includes(MASTER_PROMPT_TRIGGER)) {
        const parts = textContent.split(MASTER_PROMPT_TRIGGER);
        if (parts.length > 1) {
          setFinalPrompt(parts[1].trim());
        }
      }
    }
  }, [messages]);

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="app" style={{ userSelect: isDragging ? 'none' : 'auto' }}>
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="brand-mark" />
          <h1>AI Prompt Engineer</h1>
        </div>

        {session?.user && (
          <div className="account" ref={accountRef}>
            {credits !== null && (
              <span className="account-credits">
                {credits} {credits === 1 ? 'credit' : 'credits'}
              </span>
            )}
            <button
              type="button"
              className="account-button"
              ref={accountButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Account"
              aria-expanded={showMenu}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" />
              ) : (
                <UserIcon />
              )}
            </button>
            {showMenu && (
              <div className="account-menu">
                <div className="account-who">
                  <div className="account-who-label">Signed in as</div>
                  <div className="account-who-name" title={session.user.name || session.user.email || ''}>
                    {session.user.name || session.user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  id="sign-out-button"
                  className="account-signout"
                >
                  <SignOutIcon />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="workspace" ref={containerRef}>
        {/* Left pane: chat */}
        <div className="chat-pane" style={{ '--chat-width': `${leftWidth}%` } as CSSProperties}>
          <main className="chat-scroll">
            <div className="chat-column">
              {!hasMessages && (
                <div className="chat-empty">
                  <h2 className="chat-empty-title">What are you making?</h2>
                  <p className="chat-empty-text">
                    Describe it in a sentence. You’ll get a few short questions at most, then a master prompt to copy.
                  </p>
                </div>
              )}

              {messages?.map((message: any, index: number) => {
                const isUser = message.role === 'user';
                const rawContent = getMessageText(message);
                const hasTrigger = !isUser && rawContent.includes(MASTER_PROMPT_TRIGGER);
                const leadIn = hasTrigger ? rawContent.split(MASTER_PROMPT_TRIGGER)[0].trim() : rawContent;
                const isWriting = isLoading && index === messages.length - 1;

                // A reply that failed before any text arrived leaves an empty message behind.
                if (!isUser && !rawContent.trim() && !isWriting) return null;

                return (
                  <div
                    key={message.id || index}
                    className={`message ${isUser ? 'message-user' : 'message-assistant'}`}
                  >
                    {!isUser && !rawContent.trim() ? (
                      <WorkingCaret />
                    ) : (
                      <>
                        {leadIn && <div className="message-text">{leadIn}</div>}
                        {hasTrigger && (
                          <div className="message-status">
                            {isWriting ? (
                              'Writing your master prompt'
                            ) : (
                              <>
                                <CheckIcon />
                                <span>Master prompt ready</span>
                                <a href="#master-prompt" className="message-status-link">View</a>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {isLoading && (!hasMessages || messages[messages.length - 1].role === 'user') && (
                <div className="message message-assistant">
                  <WorkingCaret />
                </div>
              )}

              {chatErrorKind && (
                <div className="chat-error" role="alert">
                  <AlertIcon />
                  {chatErrorKind === 'credits' && <span>You’re out of credits, so no prompt was written</span>}
                  {chatErrorKind === 'session' && (
                    <>
                      <span>Your session has ended</span>
                      <a href="/login" className="chat-error-action">Sign in</a>
                    </>
                  )}
                  {chatErrorKind === 'other' && (
                    <>
                      <span>The reply couldn’t be written</span>
                      <button type="button" className="chat-error-action" onClick={() => regenerate()}>
                        Try again
                      </button>
                    </>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} className="chat-end" />
            </div>
          </main>

          <footer className="composer-wrap">
            <form
              className="composer"
              onSubmit={e => {
                e.preventDefault();
                if (!input.trim() || isLoading) return;
                if (typeof sendMessage === 'function') {
                  sendMessage({ text: input });
                } else if (typeof append === 'function') {
                  append({ role: 'user', content: input });
                }
                setInput('');
                const textarea = e.currentTarget.querySelector('textarea');
                if (textarea) {
                  textarea.style.height = 'auto';
                }
              }}
            >
              <span className="composer-caret" aria-hidden="true">&gt;</span>
              <textarea
                className="composer-input"
                value={input}
                onChange={e => {
                  setInput(e.currentTarget.value);
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                placeholder="Create a website for my business"
                aria-label="Message"
                disabled={isLoading}
                rows={1}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!input.trim() || isLoading) return;
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="composer-send"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
          </footer>
        </div>

        {/* Resizer */}
        <div
          className={`resizer ${isDragging ? 'active' : ''}`}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="resizer-grip" />
        </div>

        {/* Right pane: canvas */}
        <aside className="canvas-pane" id="master-prompt">
          <SpecSheet
            text={finalPrompt}
            aside={finalPrompt && (
              <button
                type="button"
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(finalPrompt);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            )}
          />
        </aside>
      </div>
    </div>
  );
}
