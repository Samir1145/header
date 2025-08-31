import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { throttle } from '@/lib/utils'
import { queryText, queryTextStream } from '@/api/lightrag'
import { errorMessage } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settings'
import { useDebounce } from '@/hooks/useDebounce'
import QuerySettings from '@/components/retrieval/QuerySettings'
import { ChatMessage, MessageWithError } from '@/components/retrieval/ChatMessage'
import { EraserIcon, SendIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { QueryMode } from '@/api/lightrag'
import { saveUserQnA } from '@/api/firebaseAuth'
import { getAuth } from 'firebase/auth'
import { backendBaseUrl } from '@/lib/constants'
import { useNavigationTabsStore } from '@/stores/navigationTabs';
import { useLocation } from 'react-router-dom';

const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function RetrievalTesting() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageWithError[]>(() => {
    try {
      const history = useSettingsStore.getState().retrievalHistory || []
      return history.map((msg, index) => {
        const msgWithError = msg as MessageWithError
        return {
          ...msg,
          id: msgWithError.id || `hist-${Date.now()}-${index}`,
          mermaidRendered: msgWithError.mermaidRendered ?? true
        }
      })
    } catch (error) {
      console.error('Error loading history:', error)
      return []
    }
  })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [inputError, setInputError] = useState('')
  const shouldFollowScrollRef = useRef(true)
  const isFormInteractionRef = useRef(false)
  const programmaticScrollRef = useRef(false)
  const isReceivingResponseRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const allTabs = useNavigationTabsStore(state => state.accessTabs);
//   const location = useLocation();
//  const currentPath = location.pathname; // e.g., '/access/iask'

// const matchedTab = allTabs.find(tab => tab.path === currentPath);
// const loginUrl = matchedTab?.loginUrl || backendBaseUrl;

const allTabs = useNavigationTabsStore(state => state.accessTabs);
      const location = useLocation();
      const currentPath = location.pathname.replace(/^\/+/, '');
    
      // Memoize matched tab only when tabs are ready
      const matchedTab = useMemo(() => {
        if (allTabs.length === 0) return null;
        return allTabs.find(tab => tab.path.replace(/^\/+/, '') === currentPath);
      }, [allTabs, currentPath]);
    
      const loginUrl = matchedTab?.loginUrl || backendBaseUrl;
// console.log('loginUrl',loginUrl)



// console.log('allTabs', allTabs);
// console.log('currentPath', currentPath);
// console.log('matchedTab', matchedTab);
// console.log('loginUrl', loginUrl);


  const scrollToBottom = useCallback(() => {
    programmaticScrollRef.current = true
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const allowedModes: QueryMode[] = ['naive', 'local', 'global', 'hybrid', 'mix', 'bypass']
    const prefixMatch = inputValue.match(/^\/(\w+)\s+(.+)/)
    let modeOverride: QueryMode | undefined = undefined
    let actualQuery = inputValue

    if (/^\/\S+/.test(inputValue) && !prefixMatch) {
      setInputError(t('retrievePanel.retrieval.queryModePrefixInvalid'))
      return
    }

    if (prefixMatch) {
      const mode = prefixMatch[1] as QueryMode
      const query = prefixMatch[2]
      if (!allowedModes.includes(mode)) {
        setInputError(t('retrievePanel.retrieval.queryModeError', {
          modes: allowedModes.join(', '),
        }))
        return
      }
      modeOverride = mode
      actualQuery = query
    }

    setInputError('')

    const userMessage: MessageWithError = {
      id: generateUniqueId(),
      content: inputValue,
      role: 'user'
    }

    const assistantMessage: MessageWithError = {
      id: generateUniqueId(),
      content: '',
      role: 'assistant',
      mermaidRendered: false
    }

    const prevMessages = [...messages]
    setMessages([...prevMessages, userMessage, assistantMessage])

    shouldFollowScrollRef.current = true
    isReceivingResponseRef.current = true
    setTimeout(scrollToBottom, 0)

    setInputValue('')
    setIsLoading(true)

    const updateAssistantMessage = (chunk: string, isError?: boolean) => {
      assistantMessage.content += chunk

      const mermaidBlockRegex = /```mermaid\s+([\s\S]+?)```/g
      assistantMessage.mermaidRendered = false
      let match
      while ((match = mermaidBlockRegex.exec(assistantMessage.content)) !== null) {
        if (match[1]?.trim().length > 10) {
          assistantMessage.mermaidRendered = true
          break
        }
      }

      setMessages(prev => {
        const newMessages = [...prev]
        const last = newMessages[newMessages.length - 1]
        if (last.role === 'assistant') {
          last.content = assistantMessage.content
          last.isError = isError
          last.mermaidRendered = assistantMessage.mermaidRendered
        }
        return newMessages
      })

      if (shouldFollowScrollRef.current) setTimeout(scrollToBottom, 30)
    }

    const state = useSettingsStore.getState()
    const queryParams = {
      ...state.querySettings,
      query: actualQuery,
      conversation_history: prevMessages
        .filter(m => !m.isError)
        .slice(-(state.querySettings.history_turns || 0) * 2)
        .map(m => ({ role: m.role, content: m.content })),
      ...(modeOverride ? { mode: modeOverride } : {})
    }

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      let fullAnswer = ''

      if (state.querySettings.stream) {
        let streamError = ''
        await queryTextStream(loginUrl, queryParams, (chunk) => {
          fullAnswer += chunk
          updateAssistantMessage(chunk)
        }, (error) => {
          streamError += error
        })

        if (fullAnswer && currentUser?.uid && currentUser.email) {
          await saveUserQnA(actualQuery, fullAnswer, currentUser.uid, currentUser.email)
        }

        if (streamError) {
          updateAssistantMessage(`\n${streamError}`, true)
        }
      } else {
        const response = await queryText(loginUrl, queryParams)
        fullAnswer = response.response
        updateAssistantMessage(fullAnswer)

        if (fullAnswer && currentUser?.uid && currentUser.email) {
          await saveUserQnA(actualQuery, fullAnswer, currentUser.uid, currentUser.email)
        }
      }
    } catch (err) {
      updateAssistantMessage(`${t('retrievePanel.retrieval.error')}\n${errorMessage(err)}`, true)
    } finally {
      setIsLoading(false)
      isReceivingResponseRef.current = false
      useSettingsStore.getState().setRetrievalHistory([...prevMessages, userMessage, assistantMessage])
    }
  }, [inputValue, isLoading, messages, setMessages, t, scrollToBottom])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 10 && !isFormInteractionRef.current) {
        shouldFollowScrollRef.current = false
      }
    }

    const handleScroll = throttle(() => {
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false
        return
      }

      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20
      shouldFollowScrollRef.current = isAtBottom
    }, 30)

    container.addEventListener('wheel', handleWheel as EventListener)
    container.addEventListener('scroll', handleScroll as EventListener)

    return () => {
      container.removeEventListener('wheel', handleWheel as EventListener)
      container.removeEventListener('scroll', handleScroll as EventListener)
    }
  }, [])

  useEffect(() => {
    const form = document.querySelector('form')
    if (!form) return

    const handleFormMouseDown = () => {
      isFormInteractionRef.current = true
      setTimeout(() => {
        isFormInteractionRef.current = false
      }, 500)
    }

    form.addEventListener('mousedown', handleFormMouseDown)
    return () => form.removeEventListener('mousedown', handleFormMouseDown)
  }, [])

  const debouncedMessages = useDebounce(messages, 150)
  useEffect(() => {
    if (shouldFollowScrollRef.current) scrollToBottom()
  }, [debouncedMessages, scrollToBottom])

  const clearMessages = useCallback(() => {
    setMessages([])
    useSettingsStore.getState().setRetrievalHistory([])
  }, [setMessages])

  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
      <div className="flex grow flex-col gap-4">
        <div className="relative grow">
          <div
            ref={messagesContainerRef}
            className="bg-primary-foreground/60 absolute inset-0 flex flex-col overflow-auto rounded-lg border p-2"
            onClick={() => {
              if (shouldFollowScrollRef.current) {
                shouldFollowScrollRef.current = false
              }
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center text-lg">
                  {t('retrievePanel.retrieval.startPrompt')}
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

        <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={clearMessages} disabled={isLoading} size="sm">
            <EraserIcon />
            {t('retrievePanel.retrieval.clear')}
          </Button>
          <div className="flex-1 relative">
            <label htmlFor="query-input" className="sr-only">
              {t('retrievePanel.retrieval.placeholder')}
            </label>
            <Input
              id="query-input"
              className="w-full"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                if (inputError) setInputError('')
              }}
              placeholder={t('retrievePanel.retrieval.placeholder')}
              disabled={isLoading}
            />
            {inputError && (
              <div className="absolute left-0 top-full mt-1 text-xs text-red-500">{inputError}</div>
            )}
          </div>
          <Button type="submit" variant="default" disabled={isLoading} size="sm">
            <SendIcon />
            {t('retrievePanel.retrieval.send')}
          </Button>
        </form>
      </div>
      <QuerySettings />
    </div>
  )
}
