// ============================================================
// Chat Module - Enhanced Smart Chat Page
// ============================================================

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { smartChatApi } from '@/lib/api';
import type { SmartChatMessage } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// SUGGESTED PROMPTS
// ─────────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'How many candidates do we have?',
  'Find candidates with Python experience',
  'What are the top skills in our database?',
  'Show me the average years of experience',
  'List all job descriptions',
];

// ─────────────────────────────────────────────────────────────
// MESSAGE TYPE
// ─────────────────────────────────────────────────────────────
interface Message extends SmartChatMessage {
  sources?: string[];
}

// ─────────────────────────────────────────────────────────────
// CHAT PAGE
// ─────────────────────────────────────────────────────────────
export const ChatPage = memo(function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "👋 **Hello! I'm your Smart HR Assistant.**\n\nI can query your candidate database and help you with:\n• Counting and finding candidates\n• Analyzing skills and experience\n• Semantic search over CVs\n• Job description information\n\nTry asking me something like *\"How many candidates do we have?\"* or *\"Find candidates with Python\"*!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationId = useRef(`conv_${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping) return;

    const userMessage: Message = { 
      role: 'user', 
      content: trimmedInput,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setActiveSources([]);

    try {
      const response = await smartChatApi.query(trimmedInput, conversationId.current);
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.message,
        timestamp: new Date().toISOString(),
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.sources) {
        setActiveSources(response.sources);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Sorry, I couldn't process your request. Please check that the AI backend server is running at ${import.meta.env?.VITE_AI_URL ?? 'http://localhost:9000/api/v1'}.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handlePromptClick = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: "💬 Chat cleared. How can I help you?",
      timestamp: new Date().toISOString()
    }]);
    conversationId.current = `conv_${Date.now()}`;
    setActiveSources([]);
  }, []);

  return (
    <div className="chat-page">
      <div className="chat-container">
        <Card className="chat-messages-card">
          <CardContent className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.role}`}>
                <div className={`bubble-avatar ${message.role === 'user' ? 'user-avatar' : ''}`}>
                  {message.role === 'user' ? 'U' : '🤖'}
                </div>
                <div className="bubble-content">
                  <div 
                    className="bubble-message"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                  {message.sources && message.sources.length > 0 && (
                    <div style={{ 
                      marginTop: '8px', 
                      display: 'flex', 
                      gap: '6px', 
                      flexWrap: 'wrap' 
                    }}>
                      {message.sources.map((source, i) => (
                        <span 
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            background: 'var(--kz-accent-primary)',
                            color: 'white',
                            borderRadius: '12px',
                            opacity: 0.8
                          }}
                        >
                          📊 {source}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.timestamp && (
                    <span className="bubble-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-bubble assistant">
                <div className="bubble-avatar">🤖</div>
                <div className="bubble-content">
                  <div className="bubble-message">
                    <div className="typing-indicator">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        <div className="chat-input-area">
          <div className="suggested-prompts">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                onClick={() => handlePromptClick(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <Textarea
              placeholder="Ask me about candidates, skills, experience, or job openings..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="chat-textarea"
              rows={2}
            />
            <Button 
              className="send-btn" 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? '...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      <div className="chat-sidebar">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '14px' }}>💡 Example Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="tips-list">
              <li>How many candidates do we have?</li>
              <li>Find candidates with React skills</li>
              <li>What's the average experience?</li>
              <li>Show me the top 10 skills</li>
              <li>List all job descriptions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '14px' }}>📊 Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="data-sources">
              <div className="source-item">
                <span className={`source-status ${activeSources.includes('Candidate Database') ? 'active' : ''}`} />
                <span>Candidate Database</span>
              </div>
              <div className="source-item">
                <span className={`source-status ${activeSources.includes('Vector Database') ? 'active' : ''}`} />
                <span>Vector Database</span>
              </div>
              <div className="source-item">
                <span className={`source-status ${activeSources.includes('Job Database') ? 'active' : ''}`} />
                <span>Job Database</span>
              </div>
              <div className="source-item">
                <span className="source-status active" />
                <span>Ollama LLM</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearChat}
              style={{ width: '100%', marginTop: '12px' }}
            >
              🗑️ Clear Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default ChatPage;
