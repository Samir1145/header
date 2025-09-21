import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, EraserIcon } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ChatMessage, MessageWithError } from '@/components/retrieval/ChatMessage';


interface WrenResponse {
  type?: 'SQL_QUERY' | 'NON_SQL_QUERY';
  sql?: string;
  summary?: string;
  explanation?: string;
  threadId?: string;
}

const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Wren server configuration from environment variables
const WREN_API_URL = import.meta.env.VITE_WREN_API_URL;
const WREN_API_KEY = import.meta.env.VITE_WREN_API_KEY;
const USE_PROXY = import.meta.env.VITE_WREN_USE_PROXY === 'true';

// Debug logging for configuration
console.log('🔧 Wren Configuration:', {
  apiUrl: WREN_API_URL,
  hasApiKey: !!WREN_API_KEY,
  apiKeyLength: WREN_API_KEY?.length || 0,
  useProxy: USE_PROXY
});

export default function WrenChatPage(): React.ReactElement {
  const [messages, setMessages] = useState<MessageWithError[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [inputError, setInputError] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldFollowScrollRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const isReceivingResponseRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      programmaticScrollRef.current = true;
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldFollowScrollRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const formatSummary = (summaryText: string): string => {
    if (!summaryText) return '';
    
    // Remove ending lines like "Let me know if you need more information..."
    let cleaned = summaryText.replace(/\n\nLet me know if you need more information[^.]*\./i, '');
    cleaned = cleaned.replace(/\n\nIf you need more information[^!]*!/i, '');
    
    // First convert literal \n to actual newlines, then process
    cleaned = cleaned.replace(/\\n/g, '\n');
    
    // Try to detect table-like data (key: value pairs)
    const lines = cleaned.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const keyValuePairs = lines.filter(line => line.includes(':') && !line.startsWith('-'));
    
    if (keyValuePairs.length >= 3) {
      // Format as table
      const tableRows = keyValuePairs.map(pair => {
        const [key, ...valueParts] = pair.split(':');
        const value = valueParts.join(':').trim();
        return `<tr><td><strong>${key.trim()}:</strong></td><td>${value}</td></tr>`;
      }).join('');
      return `<table style="border-collapse: collapse; width: 100%; margin: 8px 0;"><tbody>${tableRows}</tbody></table>`;
    }
    
    // Try bullet list format
    const items = lines.filter(l => l.startsWith("-") || l.match(/^[-•]\s/)).map(l => l.replace(/^[-•]\s?/, ""));
    if (items.length >= 2) {
      return `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
    }
    
    // Fallback: replace newlines with <br> tags
    return cleaned.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
  };

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: MessageWithError = {
      id: generateUniqueId(),
      role: 'user',
      content: text,
      mermaidRendered: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    isReceivingResponseRef.current = true;

    try {
      // Call Wren API using environment variables
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add API key if available
      if (WREN_API_KEY) {
        headers['Authorization'] = `Bearer ${WREN_API_KEY}`;
      }
      
      // Use proxy endpoint if CORS is an issue
      const apiUrl = USE_PROXY ? '/api/wren-proxy' : WREN_API_URL;
      
      console.log('🚀 Making request to:', apiUrl);
      console.log('📋 Request headers:', headers);
      console.log('📝 Request body:', { question: text, threadId: threadId });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        mode: USE_PROXY ? 'same-origin' : 'cors', // Use same-origin for proxy
        credentials: USE_PROXY ? 'include' : 'omit', // Include credentials for proxy
        body: JSON.stringify({
          question: text,
          threadId: threadId,
          ...(USE_PROXY && { targetUrl: WREN_API_URL }) // Include target URL for proxy
        })
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: WrenResponse = await response.json();
      console.log('✅ Response data:', data);
      
      // Update thread ID for conversation context
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      let replyContent = '';

      if (data.type === 'SQL_QUERY') {
        // Hide SQL statement - only show summary
        if (data.summary) {
          replyContent = formatSummary(data.summary);
        }
      } else if (data.type === 'NON_SQL_QUERY') {
        if (data.explanation) {
          replyContent = data.explanation.replace(/\n/g, '<br>');
        } else {
          replyContent = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
      } else {
        // Handle OSS payload (id, sql, summary, threadId)
        if (data.sql || data.summary) {
          // Hide SQL statement - only show summary
          if (data.summary) {
            replyContent = formatSummary(data.summary);
          }
        } else {
          replyContent = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
      }

      // Add AI response
      const aiMessage: MessageWithError = {
        id: generateUniqueId(),
        role: 'assistant',
        content: replyContent,
        mermaidRendered: true
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: MessageWithError = {
        id: generateUniqueId(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        isError: true,
        mermaidRendered: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      isReceivingResponseRef.current = false;
    }
  }, [inputValue, isLoading, threadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
      <div className="flex grow flex-col gap-4">
        <div className="relative grow">
          <div
            ref={messagesContainerRef}
            className="bg-primary-foreground/60 absolute inset-0 flex flex-col overflow-auto rounded-lg border p-2"
            onClick={() => {
              if (shouldFollowScrollRef.current) {
                shouldFollowScrollRef.current = false;
              }
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center text-lg">
                  Start a conversation with WrenAI! Ask questions and get intelligent responses.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <ChatMessage message={message} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="pb-1" />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Fetching...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={clearMessages} disabled={isLoading} size="sm">
            <EraserIcon />
            Clear
          </Button>
          <div className="flex-1 relative">
            <label htmlFor="query-input" className="sr-only">
              Type your question...
            </label>
            <Input
              id="query-input"
              className="w-full"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="Type your question..."
              disabled={isLoading}
            />
            {inputError && (
              <div className="absolute left-0 top-full mt-1 text-xs text-red-500">{inputError}</div>
            )}
          </div>
          <Button type="submit" variant="default" disabled={isLoading} size="sm">
            <SendIcon />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
