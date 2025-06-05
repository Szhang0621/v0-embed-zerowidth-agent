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
    "https://api.zerowidth.ai/v1/process/OCWi9PTGrb7OPwZ6FBbp/hAubXpDvbd2FVtSMJF8P",
  header: {
    title: "curious?chat with AI me ;)",
  },
  suggestedPromptsTitle: "Try ask",
  suggestedPrompts: [
    "so, what’s your working style like?",
    "what's your design story?",
    "what do you do outside design?",
  ],
  chatInputPlaceholder: "Ask me anything",
  maxChatHeight: 200,
};

export default chatConfig;
