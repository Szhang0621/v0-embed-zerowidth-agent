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
  suggestedPromptsTitle: "Check out some quick questions below!",
  suggestedPrompts: [
    "so, what’s your working style like?",
    "what's your design story?",
    "when you’re not designing, what are you up to?",
  ],
  chatInputPlaceholder: "Chat with this agent...",
  maxChatHeight: 200,
};

export default chatConfig;
