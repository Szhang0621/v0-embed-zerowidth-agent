"use client"

// =============================================================================
// Chat Agent with User & Agent Bubbles (React + Vercel)
//
// This React component renders a chat interface where users can type messages
// and receive responses from an agent via a serverless API endpoint on Vercel.
// Messages are displayed in styled chat bubbles to clearly differentiate between
// user messages (right-aligned) and agent messages (left-aligned).
//
// Key Features:
// - Maintains a conversation history.
// - Displays each message in a styled bubble.
// - Sends user messages to the API and appends the agent's response (rendered as Markdown) to the chat.
// - Automatically scrolls to the latest message in a scrollable parent container.
// - Animates the submit button while the agent is "thinking".
// - Provides detailed comments for ease of understanding.
//
// Author: Thomas J McLeish
// Date: March 2, 2025
// =============================================================================

// Import the chat configuration settings.
// includes the header title, description, and suggested prompts.
import chatConfig from "../config/config"
// Import React hooks for managing state and side effects.
import { useState, useEffect, useRef } from "react"
// Import react-markdown to render markdown content.
import ReactMarkdown from "react-markdown"
// Import UUID to generate session ID
import { v4 as uuidv4 } from "uuid"

/**
 * Retrieves or generates a session ID and stores it in sessionStorage.
 * Ensures it only runs on the client side and limits it to 32 characters.
 * @returns {string} The session ID.
 */
const getSessionId = () => {
  if (typeof window === "undefined") return "" // Prevent SSR issues

  let sessionId = sessionStorage.getItem("sessionId")
  //if the id is greater than 32 characters, we need to generate a new one.
  sessionId = sessionId && sessionId.length <= 32 ? sessionId : null

  if (!sessionId) {
    //the generated id is 36 characters long, so we need to remove the dashes and limit it to 32 characters.
    sessionId = uuidv4().replace(/-/g, "").slice(0, 32) // Ensure max 32 chars
    sessionStorage.setItem("sessionId", sessionId)
  }
  return sessionId
}

/**
 * Retrieves or generates a persistent user ID and stores it in localStorage.
 * Ensures it only runs on the client side and limits it to 32 characters.
 * @returns {string} The user ID.
 */
const getUserId = () => {
  if (typeof window === "undefined") return "" // Prevent SSR issues

  let userId = localStorage.getItem("userId")
  //if the id is greater than 32 characters, we need to generate a new one.
  userId = userId && userId.length <= 32 ? userId : null

  if (!userId) {
    //the generated id is 36 characters long, so we need to remove the dashes and limit it to 32 characters.
    userId = uuidv4().replace(/-/g, "").slice(0, 32) // Ensure max 32 chars
    localStorage.setItem("userId", userId)
  }
  return userId
}

/**
 * AgentComponent renders a chat interface with user and agent bubbles.
 * It manages the conversation state, handles user input and API requests,
 * and renders responses as Markdown.
 *
 * @returns {JSX.Element} The rendered chat interface.
 */
export default function AgentComponent() {
  // State to store the user's current input from the text field.
  const [message, setMessage] = useState("")

  // State to store the conversation as an array of message objects.
  // Each message object has a role ("user" or "agent") and the message content.
  const [conversation, setConversation] = useState([])

  // State to capture any errors during the API request.
  const [error, setError] = useState(null)

  // State to track if the agent is processing (loading state).
  const [isLoading, setIsLoading] = useState(false)

  // Create a ref to track the end of the messages container.
  const messagesEndRef = useRef(null)

  // Initialize session ID and user ID states.
  const [sessionId, setSessionId] = useState("")
  const [userId, setUserId] = useState("")

  // Initialize the hovered index state for suggested prompts.
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // State to track if the submit button is hovered.
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)

  // Initialize session ID and user ID on the client side
  useEffect(() => {
    setSessionId(getSessionId())
    setUserId(getUserId())
  }, [])

  /**
   * Scrolls the chat container to the bottom to ensure the latest message is visible.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to the latest message whenever the conversation updates.
  useEffect(() => {
    if (document.querySelector(".chat-container")) {
      scrollToBottom()
    }
  }, [conversation])

  /**
   * Handles the form submission event.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    submitMessage(message)
  }

  /**
   * Handles the submission of the chat input form.
   *
   * Prevents the default form submission behavior, updates the conversation
   * with the user's message, sends the message to the API, and appends the agent's
   * response to the conversation.
   *
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>} A promise that resolves when the submission is complete.
   */
  const submitMessage = async (userInput) => {
    // If the message is empty, do nothing.
    if (!userInput.trim()) return

    // Clear the input immediately after user submits
    setMessage("")

    // Clear any previous errors.
    setError(null)

    // Create a new conversation entry for the user's message.
    const userMessage = {
      role: "user",
      content: userInput.trim(),
    }

    // Update the conversation state by adding the user's message.
    setConversation((prev) => [...prev, userMessage])

    // Prepare the payload for the API call.
    // Note: In production, user_id and session_id should be uniquely generated.
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
      // Set loading state to true to trigger the animation.
      setIsLoading(true)

      // Send a POST request to the serverless API endpoint on Vercel.
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // If the server response is not OK, throw an error.
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      // Parse the JSON response from the API.
      const data = await res.json()

      // Extract the agent's reply from output_data.content.
      // If output_data or content is missing, fall back to a default message.
      const agentReply =
        data.output_data && data.output_data.content
          ? data.output_data.content
          : "No valid response received from agent."

      // Create a new conversation entry for the agent's response.
      const agentMessage = {
        role: "agent",
        content: agentReply,
      }

      // Update the conversation state by adding the agent's message.
      setConversation((prev) => [...prev, agentMessage])

      // Clear the user input field.
      setMessage("")
    } catch (err) {
      // Log the error to the console for debugging.
      console.error("Error fetching agent response:", err)
      // Update the error state so that the user is informed.
      setError(err.message)
    } finally {
      // Reset the loading state regardless of success or error.
      setIsLoading(false)
    }
  }

  /**
   * Inline styles for chat bubbles based on the message role.
   *
   * @type {Object}
   * @property {Object} user - Styles for user messages (right-aligned, white background).
   * @property {Object} agent - Styles for agent messages (left-aligned, blue background).
   */
  const bubbleStyles = {
    user: {
      alignSelf: "flex-end",
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: "12px 16px",
      borderRadius: "18px 18px 4px 18px",
      border: "1px solid #e5e5e7",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "15px",
      lineHeight: "1.4",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
    },
    agent: {
      alignSelf: "flex-start",
      backgroundColor: "#1271FF",
      color: "#ffffff",
      padding: "12px 16px",
      borderRadius: "18px 18px 18px 4px",
      margin: "4px 0",
      maxWidth: "75%",
      fontSize: "15px",
      lineHeight: "1.4",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    },
  }

  /**
   * Handles the click event on a suggested prompt.
   *
   * Sets the chat input to the prompt text when clicked.
   * Submit the prompt to the chat
   *
   * @param {Object} prompt - The prompt object containing text and autoSubmit flag.
   */
  const handlePromptClick = async (prompt) => {
    // Set the chat input to the prompt text.
    setMessage(prompt)
    // Submit the prompt to the chat.
    setTimeout(() => {
      submitMessage(prompt)
    }, 0) // Ensures the state has been updated before calling submitMessage
  }

  /**
   * Handles the mouseover event on a suggested prompt.
   * @param {*} index
   */
  const handlePromptMouseOver = (index) => {
    if (!isLoading) {
      setHoveredIndex(index)
    }
  }

  /**
   * Handles the mouseout event on a suggested prompt.
   */
  const handlePromptMouseOut = () => {
    setHoveredIndex(null)
  }

  return (
    <div
      style={{
        padding: "0",
        width: "100vw",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "PP Neue Montreal, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Descriptive header for the chat application */}
      <div
        className="chat-header"
        style={{
          padding: "24px 20px 16px 20px",
          userSelect: "none",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div
          className="chat-title"
          style={{
            color: "#000000",
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          {chatConfig.header.title}
        </div>
        <div
          className="chat-description"
          style={{
            color: "#6e6e73",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
          }}
        >
          {chatConfig.header.description}
        </div>
      </div>

      {/* Chat conversation container displaying messages in bubbles */}
      <div
        className="chat-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          overflowY: "auto",
          border: "2px solid #000000",
          margin: "20px",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          padding: "20px",
          minHeight: "400px",
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
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            Start a conversation...
          </div>
        )}
        {conversation.map((msg, index) => (
          <div key={index} style={msg.role === "user" ? bubbleStyles.user : bubbleStyles.agent}>
            {msg.role === "agent" ? (
              // Render the agent's response as Markdown.
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
                        borderRadius: "4px",
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
              // Display user messages as plain text.
              msg.content
            )}
          </div>
        ))}
        {/* Dummy element to ensure the latest message is scrolled into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Section */}
      <div
        style={{
          padding: "0 20px 16px 20px",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#6e6e73",
          }}
        >
          {chatConfig.suggestedPromptsTitle}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {chatConfig.suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              onMouseOver={() => handlePromptMouseOver(index)}
              onMouseOut={handlePromptMouseOut}
              disabled={isLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #d1d1d6",
                backgroundColor: hoveredIndex === index ? "#f5f5f7" : "#ffffff",
                color: "#000000",
                fontSize: "14px",
                fontWeight: "400",
                cursor: isLoading ? "default" : "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat input form for the user to send messages */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              width: "100%",
              border: "2px solid #000000",
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <input
              type="text"
              id="message"
              placeholder={chatConfig.chatInputPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                flexGrow: 1,
                padding: "16px 20px",
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "16px",
                fontFamily: "inherit",
                color: "#000000",
              }}
            />
            <button
              type="submit"
              aria-label="Send prompt"
              data-testid="send-button"
              disabled={isLoading || !message.trim()}
              onMouseOver={() => setIsSubmitHovered(true)}
              onMouseOut={() => setIsSubmitHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.2s ease",
                backgroundColor: isSubmitHovered && !isLoading && message.trim() ? "#0056d3" : "#1271FF",
                color: "#ffffff",
                height: "40px",
                width: "40px",
                border: "none",
                margin: "8px",
                cursor: isLoading || !message.trim() ? "default" : "pointer",
                opacity: isLoading || !message.trim() ? 0.5 : 1,
                outline: "none",
              }}
            >
              {!isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.0122 5.57169L15.0711 8.6306C15.4616 9.02112 15.4616 9.65429 15.0711 10.0448C14.6805 10.4353 14.0474 10.4353 13.6568 10.0448L12.5 8.88795V19C12.5 19.5523 12.0523 20 11.5 20C10.9477 20 10.5 19.5523 10.5 19V8.88795L9.34314 10.0448C8.95262 10.4353 8.31946 10.4353 7.92893 10.0448C7.53841 9.65429 7.53841 9.02112 7.92893 8.6306L10.9878 5.57169C11.3783 5.18117 12.0115 5.18117 12.4021 5.57169L12.0122 5.57169Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
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
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tiny display of user ID and session ID */}
      <div
        style={{
          padding: "0 20px 20px 20px",
          fontSize: "11px",
          color: "#8e8e93",
          textAlign: "center",
          fontWeight: "400",
        }}
      >
        User ID: {userId} | Session ID: {sessionId}
      </div>

      {/* Display error message if one occurs */}
      {error && (
        <div
          style={{
            color: "#ff3b30",
            padding: "0 20px 20px 20px",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Define keyframes for the spin animation */}
      <style jsx>{`
        .chat-container::-webkit-scrollbar {
          width: 6px;
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background-color: #d1d1d6;
          border-radius: 3px;
        }
        .chat-container::-webkit-scrollbar-thumb:hover {
          background-color: #a1a1a6;
        }
        /* Firefox scrollbar styling */
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: #d1d1d6 transparent;
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

  );
}
