'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: 'var(--brand-light)', filter: 'drop-shadow(0 0 8px rgba(165, 180, 252, 0.6))' }}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: 'var(--blue-light)' }}>
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
    <path d="M12 8V4H8" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Chat() {
  const [input, setInput] = useState('');
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, append, status } = useChat() as any;
  const isLoading = status === 'submitted' || status === 'streaming';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
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
      let textContent = '';
      if (lastAssistantMessage.parts) {
        textContent = lastAssistantMessage.parts.map((p: any) => p.type === 'text' ? p.text : '').join('');
      } else {
        textContent = lastAssistantMessage.content || lastAssistantMessage.text || '';
      }

      const trigger = '✅ Here is your master prompt:';
      if (textContent.includes(trigger)) {
        const parts = textContent.split(trigger);
        if (parts.length > 1) {
          setFinalPrompt(parts[1].trim());
        }
      }
    }
  }, [messages]);

  return (
    <div
      className="layout-container"
      ref={containerRef}
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >

      {/* Left Pane: Chat */}
      <div className="chat-pane" style={{ display: 'flex', flexDirection: 'column', width: `${leftWidth}%`, minWidth: '300px' }}>
        <header style={{ flexShrink: 0, marginBottom: '2rem', textAlign: 'center' }}>
          <h1 className="main-title" style={{ textAlign: 'center' }}>AI Prompt Engineer</h1>
          <p className="subtitle" style={{ textAlign: 'center' }}>Refine and optimize your prompts</p>
        </header>

        <main className="results-row" style={{ flex: 1, overflowY: 'auto', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem', paddingRight: '0.5rem' }}>
          {(!messages || messages.length === 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.7 }}>
              <BotIcon />
              <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Let's engineer something great!</p>
            </div>
          )}

          {messages?.map((message: any, index: number) => {
            // Check if this message contains the trigger to highlight it or keep it as is
            let displayContent = null;
            let isFinalPromptMessage = false;

            let rawContent = '';
            if (message?.parts) {
              rawContent = message.parts.map((part: any) => part.type === 'text' ? part.text : '').join('');
            } else {
              rawContent = message.content || message.text || '';
            }

            const trigger = '✅ Here is your master prompt:';
            if (message.role === 'assistant' && rawContent.includes(trigger)) {
              isFinalPromptMessage = true;
              const [preTrigger] = rawContent.split(trigger);
              displayContent = preTrigger.trim() ? (
                <>
                  <div style={{ paddingBottom: '0.5rem' }}>{preTrigger.trim()}</div>
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', color: 'var(--success)' }}>
                    ✅ The master prompt has been generated and moved to the Canvas on the right.
                  </div>
                </>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', color: 'var(--success)' }}>
                  ✅ The master prompt has been generated and moved to the Canvas on the right.
                </div>
              );
            } else {
              displayContent = message?.parts ? message.parts.map((part: any, i: number) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id || index}-${i}`}>{part.text}</div>;
                  default:
                    return null;
                }
              }) : rawContent;
            }

            return (
              <div
                key={message.id || index}
                className="result-card"
                style={{
                  animationDelay: `${(index % 3) * 0.1}s`,
                  maxWidth: '85%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginLeft: message.role === 'user' ? 'auto' : '0',
                  marginRight: message.role === 'user' ? '0' : 'auto',
                  border: message.role === 'user' ? '1px solid rgba(165, 180, 252, 0.3)' : (isFinalPromptMessage ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border-subtle)'),
                  backgroundColor: message.role === 'user' ? 'rgba(129, 140, 248, 0.08)' : 'var(--bg-card)',
                  boxShadow: message.role === 'user' ? '0 0 3px rgba(129, 140, 248, 0.15)' : (isFinalPromptMessage ? '0 0 12px rgba(52, 211, 153, 0.15)' : 'none')
                }}
              >
                <div className="card-header" style={{ marginBottom: '0.5rem', opacity: 0.8 }}>
                  {message.role === 'user' ? (
                    <>
                      <UserIcon />
                      <span className="region-badge" style={{
                        marginLeft: '0.5rem',
                        color: 'var(--brand-light)',
                        backgroundColor: 'rgba(129, 140, 248, 0.15)',
                        border: '1px solid rgba(129, 140, 248, 0.4)',
                        boxShadow: '0 0 12px rgba(129, 140, 248, 0.4)',
                        textShadow: '0 0 8px rgba(165, 180, 252, 0.6)'
                      }}>You</span>
                    </>
                  ) : (
                    <>
                      <BotIcon />
                      <span className="region-badge" style={{ marginLeft: '0.5rem', backgroundColor: isFinalPromptMessage ? 'rgba(52, 211, 153, 0.15)' : '', color: isFinalPromptMessage ? 'var(--success)' : '', boxShadow: isFinalPromptMessage ? '0 0 8px rgba(52, 211, 153, 0.5)' : '', borderColor: isFinalPromptMessage ? 'rgba(52, 211, 153, 0.4)' : '' }}>Assistant</span>
                    </>
                  )}
                </div>

                <div style={{ 
                  fontSize: '1rem', 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.6',
                  animation: message.role === 'assistant' ? 'textStreamReveal 0.6s ease-out' : 'none'
                }}>
                  {displayContent}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} style={{ height: '1px', flexShrink: 0 }} />
        </main>

        <footer style={{ flexShrink: 0, marginTop: 'auto', paddingTop: '1rem' }}>
          <form
            className="search-wrapper"
            style={{ maxWidth: '100%', margin: '0 auto' }}
            onSubmit={e => {
              e.preventDefault();
              if (!input.trim() || isLoading) return;
              if (typeof sendMessage === 'function') {
                sendMessage({ text: input });
              } else if (typeof append === 'function') {
                append({ role: 'user', content: input });
              }
              setInput('');
            }}
          >
            <input
              className="search-input"
              value={input}
              onChange={e => setInput(e.currentTarget.value)}
              placeholder="eg. Create a website for my business"
              disabled={isLoading}
              onKeyDown={e => {
                if (e.key === 'Enter' && isLoading) {
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Enter' && !input.trim()) {
                  e.preventDefault();
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="submit-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </footer>
      </div>

      {/* Resizer */}
      <div
        className={`resizer-container ${isDragging ? 'active' : ''}`}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="resizer-bar" />
      </div>

      {/* Right Pane: Canvas */}
      <aside className="canvas-pane" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <h2 className={`canvas-header ${finalPrompt ? 'active' : ''}`} style={{ marginBottom: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
            Master Prompt Canvas
          </h2>
          {finalPrompt && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(finalPrompt);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isCopied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(129, 140, 248, 0.1)',
                color: isCopied ? 'var(--success)' : 'var(--brand-light)',
                border: `1px solid ${isCopied ? 'rgba(52, 211, 153, 0.3)' : 'rgba(129, 140, 248, 0.2)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {isCopied ? <CheckIcon /> : <CopyIcon />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {finalPrompt ? (
          <div className="final-prompt-content" style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {finalPrompt}
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, textAlign: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            <p style={{ maxWidth: '280px', lineHeight: '1.5' }}>Your master prompt will appear here once the AI has finished analyzing your request.</p>
          </div>
        )}
      </aside>

    </div>
  );
}