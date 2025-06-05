"use client"

import chatConfig from "../config/config"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { v4 as uuidv4 } from "uuid"

const getSessionId = () => {
  if (typeof window === "undefined") return ""
  let sessionId = sessionStorage.getItem("sessionId")
  sessionId = sessionId && sessionId.length <= 32 ? sessionId : null
  if (!sessionId) {
    sessionId = uuidv4().replace(/-/g, "").slice(0, 32)
    sessionStorage.setItem("sessionId", sessionId)
  }
  return sessionId
}

const getUserId = () => {
  if (typeof window === "undefined") return ""
  let userId = localStorage.getItem("userId")
  userId = userId && userId.length <= 32 ? userId : null
  if (!userId) {
    userId = uuidv4().replace(/-/g, "").slice(0, 32)
    localStorage.setItem("userId", userId)
  }
  return userId
}

export default function AgentComponent() {
  const [message, setMessage] = useState("")
  const [conversation, setConversation] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const [sessionId, setSessionId] = useState("")
  const [userId, setUserId] = useState("")
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)

  // State for rotating suggestions
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)

  useEffect(() => {
    setSessionId(getSessionId())
    setUserId(getUserId())

    // Set up rotation for suggestions
    const rotationInterval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % chatConfig.suggestedPrompts.length)
    }, 3000)

    return () => clearInterval(rotationInterval)
  }, [])

  // Modified scroll function to only scroll within the chat container
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Only scroll when there are messages and avoid initial scroll
  useEffect(() => {
    if (conversation.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [conversation])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Prevent default form submission behavior that might cause scrolling
    e.stopPropagation()
    submitMessage(message)
  }

  const submitMessage = async (userInput) => {
    if (!userInput.trim()) return
    setMessage("")
    setError(null)

    const userMessage = {
      role: "user",
      content: userInput.trim(),
    }

    setConversation((prev) => [...prev, userMessage])

    const payload = {
      data: {
        message: userMessage,
      },
      stateful: true,
      stream: false,
      user_id: userId,
      session_id: sessionId,
      verbose: false,
    }

    try {
      setIsLoading(true)

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()

      const agentReply =
        data.output_data && data.output_data.content
          ? data.output_data.content
          : "No valid response received from agent."

      const agentMessage = {
        role: "agent",
        content: agentReply,
      }

      setConversation((prev) => [...prev, agentMessage])
      setMessage("")
    } catch (err) {
      console.error("Error fetching agent response:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const bubbleStyles = {
    user: {
      alignSelf: "flex-end",
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: "10px 14px",
      border: "1px solid #e5e5e7",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "13px",
      lineHeight: "1.4",
    },
    agent: {
      alignSelf: "flex-start",
      background: "linear-gradient(135deg, #1271FF 0%, #76A9F4 100%)",
      color: "#ffffff",
      padding: "10px 14px",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "13px",
      lineHeight: "1.4",
    },
  }

  const handlePromptClick = (prompt) => {
    setMessage(prompt)
    setTimeout(() => {
      submitMessage(prompt)
    }, 0)
  }

  // Prevent input focus from scrolling the page
  const handleInputFocus = (e) => {
    e.preventDefault()
    // Prevent the default scroll behavior
    if (e.target.scrollIntoView) {
      e.target.scrollIntoView = () => {}
    }
  }

  const currentSuggestion = chatConfig.suggestedPrompts[currentSuggestionIndex]

  // Calculate dynamic height based on conversation state
  const getContainerHeight = () => {
    if (conversation.length === 0) {
      return "auto" // Minimal height for initial state
    } else if (conversation.length <= 2) {
      return "150px" // Small expansion for first interaction
    } else {
      return "300px" // Full height for ongoing conversation
    }
  }

  const getChatAreaHeight = () => {
    if (conversation.length === 0) {
      return "0px" // No chat area when empty
    } else if (conversation.length <= 2) {
      return "80px" // Small chat area
    } else {
      return "180px" // Full chat area
    }
  }

  return (
    <div style={{ width: "267px", fontFamily: "PP Neue Montreal, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Main chatbox */}
      <div
        style={{
          width: "267px",
          height: getContainerHeight(),
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          className="chat-header"
          style={{
            padding: "12px 16px",
            borderBottom: conversation.length > 0 ? "1px solid #f0f0f0" : "none",
            textAlign: "center",
          }}
        >
          <div
            className="chat-title"
            style={{
              color: "#000000",
              fontSize: "16px",
              fontWeight: "500",
              letterSpacing: "-0.01em",
            }}
          >
            {chatConfig.header.title}
          </div>
        </div>

        {/* Chat container - only visible when there are messages */}
        {conversation.length > 0 && (
          <div
            ref={chatContainerRef}
            className="chat-container"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              height: getChatAreaHeight(),
              overflowY: "auto",
              padding: "12px",
              backgroundColor: "#ffffff",
              transition: "height 0.3s ease",
            }}
          >
            {conversation.map((msg, index) => (
              <div key={index} style={msg.role === "user" ? bubbleStyles.user : bubbleStyles.agent}>
                {msg.role === "agent" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: 0, color: "#ffffff" }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ color: "#ffffff" }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "#ffffff" }}>{children}</em>,
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            padding: "2px 4px",
                            fontSize: "12px",
                            color: "#ffffff",
                          }}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input form */}
        <div style={{ padding: "10px 12px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              id="message"
              placeholder={chatConfig.chatInputPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={handleInputFocus}
              style={{
                flexGrow: 1,
                padding: "8px 12px",
                border: "1px solid #e5e5e7",
                outline: "none",
                backgroundColor: "#f5f5f7",
                fontSize: "13px",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              aria-label="Send prompt"
              disabled={isLoading || !message.trim()}
              onMouseOver={() => setIsSubmitHovered(true)}
              onMouseOut={() => setIsSubmitHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLoading || !message.trim() ? "#e5e5e7" : "#1271FF",
                color: "#ffffff",
                height: "32px",
                width: "32px",
                border: "none",
                cursor: isLoading || !message.trim() ? "default" : "pointer",
                opacity: isLoading || !message.trim() ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {!isLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="32"
                    strokeDashoffset="32"
                    fill="none"
                  />
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              color: "#ff3b30",
              padding: "8px 12px",
              fontSize: "12px",
              textAlign: "center",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            Error: {error}
          </div>
        )}
      </div>

      {/* Try ask section - outside the chatbox */}
      <div
        style={{
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "267px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#8e8e93",
            marginRight: "6px",
          }}
        >
          {chatConfig.suggestedPromptsTitle}:
        </div>
        <button
          onClick={() => handlePromptClick(currentSuggestion)}
          disabled={isLoading}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "#1271FF",
            fontSize: "12px",
            cursor: "pointer",
            textDecoration: "underline",
            fontFamily: "inherit",
          }}
        >
          {currentSuggestion}
        </button>
      </div>

      <style jsx>{`
        .chat-container::-webkit-scrollbar {
          width: 4px;
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background-color: #e5e5e7;
        }
        .chat-container::-webkit-scrollbar-thumb:hover {
          background-color: #d1d1d6;
        }
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: #e5e5e7 transparent;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

}

