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
        const errorText = await res.text()
        throw new Error(`Server error: ${res.status} - ${errorText}`)
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
      backgroundColor: "#000000",
      color: "#ffffff",
      padding: "10px 14px",
      borderRadius: "14px 14px 4px 14px",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "13px",
      lineHeight: "1.4",
    },
    agent: {
      alignSelf: "flex-start",
      backgroundColor: "#E0F1F6",
      color: "#000000",
      padding: "10px 14px",
      border: "1px solid #000000",
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

  // Prevent input focus from scrolling the page
  const handleInputFocus = (e) => {
    e.preventDefault()
    // Prevent the default scroll behavior
    if (e.target.scrollIntoView) {
      e.target.scrollIntoView = () => {}
    }
  }

  const currentSuggestion = chatConfig.suggestedPrompts[currentSuggestionIndex]

  // Clock positions for the 8 surrounding dots - 50px distance from center
  const clockPositions = [
    { x: 0, y: -50 }, // 12 o'clock
    { x: 35.36, y: -35.36 }, // 1:30 (45 degrees)
    { x: 50, y: 0 }, // 3 o'clock
    { x: 35.36, y: 35.36 }, // 4:30 (135 degrees)
    { x: 0, y: 50 }, // 6 o'clock
    { x: -35.36, y: 35.36 }, // 7:30 (225 degrees)
    { x: -50, y: 0 }, // 9 o'clock
    { x: -35.36, y: -35.36 }, // 10:30 (315 degrees)
  ]

  return (
    <div style={{ width: "301px", fontFamily: "PP Neue Montreal, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Main chatbox */}
      <div
        style={{
          width: "301px",
          height: "360px",
          backgroundColor: "#E0F1F6",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          className="chat-header"
          style={{
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <div
            className="chat-title"
            style={{
              color: "#000000",
              fontSize: "18px",
              fontWeight: "500",
              letterSpacing: "-0.01em",
              textAlign: "left",
            }}
          >
            Chat with AI me
          </div>

          {/* Loading dots in top right corner */}
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                display: "flex",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#000000",
                  borderRadius: "50%",
                  animation: "loadingDot 1.5s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#000000",
                  borderRadius: "50%",
                  animation: "loadingDot 1.5s ease-in-out infinite",
                  animationDelay: "0.3s",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#000000",
                  borderRadius: "50%",
                  animation: "loadingDot 1.5s ease-in-out infinite",
                  animationDelay: "0.6s",
                }}
              />
            </div>
          )}
        </div>

        {/* Center dots pattern - only visible when no conversation */}
        {conversation.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "46%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "120px",
              height: "120px",
              animation: "breathingPulse 3s ease-in-out infinite",
            }}
          >
            {/* Center dot */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "8px",
                height: "8px",
                backgroundColor: "#000000",
                borderRadius: "50%",
              }}
            />

            {/* Surrounding dots in clock positions */}
            {clockPositions.map((position, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#000000",
                  borderRadius: "50%",
                }}
              />
            ))}
          </div>
        )}

        {/* Chat container - visible when there are messages */}
        {conversation.length > 0 && (
          <div
            ref={chatContainerRef}
            className="chat-container"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              flex: 1,
              overflowY: "auto",
              backgroundColor: "transparent",
              marginBottom: "20px",
            }}
          >
            {conversation.map((msg, index) => (
              <div key={index} style={msg.role === "user" ? bubbleStyles.user : bubbleStyles.agent}>
                {msg.role === "agent" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: 0, color: "#000000" }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ color: "#000000" }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "#000000" }}>{children}</em>,
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#000000",
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

        {/* Input form - positioned at bottom */}
        <div style={{ marginTop: "auto" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              id="message"
              placeholder={chatConfig.chatInputPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={handleInputFocus}
              style={{
                flexGrow: 1,
                padding: "0 16px",
                border: "1px solid #000000",
                borderRadius: "15px",
                outline: "none",
                backgroundColor: "#E0F1F6",
                fontSize: "13px",
                fontFamily: "inherit",
                height: "50px",
                boxSizing: "border-box",
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
                borderRadius: "15px",
                backgroundColor: "#000000",
                color: "#ffffff",
                height: "50px",
                width: "50px",
                border: "none",
                cursor: isLoading || !message.trim() ? "default" : "pointer",
                opacity: isLoading || !message.trim() ? 0.5 : 1,
                transition: "all 0.2s ease",
                flexShrink: 0,
                boxSizing: "border-box",
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
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "8px",
              marginTop: "8px",
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
          width: "301px",
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
            color: "#000000",
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
          background-color: rgba(0, 0, 0, 0.2);
        }
        .chat-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }
        @keyframes breathingPulse {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
