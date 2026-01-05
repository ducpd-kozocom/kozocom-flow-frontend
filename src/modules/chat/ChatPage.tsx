// ============================================================
// Chat Module - Page Component
// ============================================================

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/lib/api';
import type { ChatMessage } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// SUGGESTED PROMPTS
// ─────────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'Who is the developer with most security errors?',
  'Find candidates with React experience',
  'What are the top error types this week?',
  'Show me the best matching candidates',
];

// ─────────────────────────────────────────────────────────────
// CHAT PAGE
// ─────────────────────────────────────────────────────────────
export const ChatPage = memo(function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: "👋 **Hello! I'm the Smart Integrator.**\n\nI can help you with:\n• Finding candidates by skills\n• Analyzing code review trends\n• Identifying top error types\n\nAsk me anything about your workforce or code quality data!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatApi.query(trimmedInput, sessionId.current);
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.message,
        timestamp: response.timestamp
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ Sorry, I couldn't process your request. Please check that the backend server is running."
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
                        .replace(/\n/g, '<br/>')
                    }}
                  />
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
              placeholder="Ask me about candidates, code reviews, or analytics..."
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
            <CardTitle style={{ fontSize: '14px' }}>💡 Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="tips-list">
              <li>Ask about specific developers</li>
              <li>Query candidate skills</li>
              <li>Analyze error trends</li>
              <li>Get recommendations</li>
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
                <span className="source-status active" />
                <span>Candidates Database</span>
              </div>
              <div className="source-item">
                <span className="source-status active" />
                <span>Code Reviews</span>
              </div>
              <div className="source-item">
                <span className="source-status active" />
                <span>Ollama LLM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default ChatPage;
