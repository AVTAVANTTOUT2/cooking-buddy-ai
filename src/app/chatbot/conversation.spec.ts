import { ChatMessage, conversationContext } from './conversation';

describe('conversationContext', () => {
  it('keeps recent complete turns and the current question within 19 messages', () => {
    const history: ChatMessage[] = Array.from({ length: 12 }, (_, index) => [
      { role: 'user' as const, content: `Question ${index}` },
      { role: 'assistant' as const, content: `Réponse ${index}` },
    ]).flat();

    const context = conversationContext(history, 'Question actuelle');

    expect(context).toHaveLength(19);
    expect(context[0]).toEqual({ role: 'user', content: 'Question 3' });
    expect(context.at(-1)).toEqual({ role: 'user', content: 'Question actuelle' });
    expect(history).toHaveLength(24);
  });

  it('limits total characters and long assistant responses without breaking turn order', () => {
    const history: ChatMessage[] = Array.from({ length: 4 }, () => [
      { role: 'user' as const, content: 'u'.repeat(4000) },
      { role: 'assistant' as const, content: 'a'.repeat(6000) },
    ]).flat();

    const context = conversationContext(history, 'q'.repeat(4000));

    expect(context.map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
      'user',
    ]);
    expect(context.every((message) => message.content.length <= 4000)).toBe(true);
    expect(
      context.reduce((total, message) => total + message.content.length, 0),
    ).toBeLessThanOrEqual(24000);
    expect(history[1].content.length).toBe(6000);
  });
});
