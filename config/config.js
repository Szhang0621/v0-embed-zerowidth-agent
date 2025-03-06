// config.js
// =============================================================================
// Chat Application Configuration
// =============================================================================
// This configuration file stores metadata and descriptions related to the Chat Agent component.
// The goal is to keep the main component clean and maintainable.
//
// Key Features:
// - Stores the descriptive header for the chat component.
// - Provides metadata such as the author and version.
// - Can be extended for additional configuration settings in the future.
// =============================================================================

const chatConfig = {
  flowURL:
    https://api.zerowidth.ai/beta/process/OCWi9PTGrb7OPwZ6FBbp/hAubXpDvbd2FVtSMJF8P,
  header: {
    title: "Chat with SYLVIA",
    description:
      "Hi! I am an AI agent representing Sylvia Zhang, let's chat :)",
  },
  suggestedPromptsTitle: "check out some quick questions below!",
  suggestedPrompts: [
    "I spend too much time with computers.",
    "I feel overwhelmed trying to keep up with AI trends.",
    "I am anxious about the future.",
  ],
  chatInputPlaceholder: "Chat with this agent...",
  maxChatHeight: 200,
};

export default chatConfig;
