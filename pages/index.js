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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (document.querySelector(".chat-container")) {
      scrollToBottom()
    }
  }, [conversation])

  const handleSubmit = (e) => {
    e.preventDefault()
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
      borderRadius: "14px 14px 4px 14px",
      border: "1px solid #e5e5e7",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "13px",
      lineHeight: "1.4",
    },
    agent: {
      alignSelf: "flex-start",
      backgroundColor: "#1271FF",
      color: "#ffffff",
      padding: "10px 14px",
      borderRadius: "14px 14px 14px 4px",
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

  const currentSuggestion = chatConfig.suggestedPrompts[currentSuggestionIndex]

  return (
    <div
      style={{
        width: "267px",
        height: "402px",
        margin: "0 auto",
        fontFamily: "PP Neue Montreal, -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        border: "2px solid #000000",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="chat-header"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
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

      {/* Chat container */}
      <div
        className="chat-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          backgroundColor: "#ffffff",
        }}
      >
        {conversation.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#8e8e93",
              fontSize: "13px",
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            Start a conversation...
          </div>
        )}
        {conversation.map((msg, index) => (
          <div key={index} style={msg.role === "user" ? bubbleStyles.user : bubbleStyles.agent}>
            {msg.role === "agent" ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: 0, color: msg.role === "agent" ? "#ffffff" : "#000000" }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: msg.role === "agent" ? "#ffffff" : "#000000" }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: msg.role === "agent" ? "#ffffff" : "#000000" }}>{children}</em>
                  ),
                  code: ({ children }) => (
                    <code
                      style={{
                        backgroundColor: msg.role === "agent" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        color: msg.role === "agent" ? "#ffffff" : "#000000",
                        fontSize: "12px",
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

      {/* Rotating suggestion */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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

      {/* Input form */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f0" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            id="message"
            placeholder={chatConfig.chatInputPlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "8px 12px",
              border: "1px solid #e5e5e7",
              borderRadius: "16px",
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
              borderRadius: "50%",
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

      <style jsx>{`
        .chat-container::-webkit-scrollbar {
          width: 4px;
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background-color: #e5e5e7;
          border-radius: 4px;
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

