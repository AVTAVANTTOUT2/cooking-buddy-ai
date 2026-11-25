export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Keep complete recent turns within the API's conversation limits. */
export function conversationContext(history: ChatMessage[], question: string): ChatMessage[] {
  const messages: ChatMessage[] = [
    ...history.map((message) => ({ ...message, content: message.content.slice(0, 4000) })),
    { role: 'user', content: question },
  ];

  while (
    messages.length > 19 ||
    messages.reduce((total, message) => total + message.content.length, 0) > 24000
  ) {
    messages.splice(0, 2);
  }

  return messages;
}
