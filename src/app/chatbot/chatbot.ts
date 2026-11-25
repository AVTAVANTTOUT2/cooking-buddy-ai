import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { ChatMessage, conversationContext } from './conversation';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements OnInit, OnDestroy {
  @ViewChild('questionInput') private questionInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('conversation') private conversation?: ElementRef<HTMLDivElement>;

  protected readonly status = signal<'checking' | 'ready' | 'unconfigured' | 'unavailable'>(
    'checking',
  );
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly pending = signal(false);
  protected readonly pendingQuestion = signal('');
  protected readonly error = signal('');
  protected readonly suggestions = [
    'Que cuisiner avec des œufs, du riz et des tomates ?',
    'Propose-moi un dîner végétarien en 20 minutes.',
    'Par quoi remplacer la crème dans une sauce ?',
  ];

  private chatController?: AbortController;
  private statusController?: AbortController;
  private destroyed = false;

  ngOnInit() {
    void this.checkStatus();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.chatController?.abort();
    this.statusController?.abort();
  }

  protected async checkStatus() {
    this.statusController?.abort();
    const controller = new AbortController();
    this.statusController = controller;
    this.status.set('checking');
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('/api/chat/status', { signal: controller.signal });
      if (!response.ok) throw new Error('Service indisponible');
      const body = await response.json();
      if (typeof body.configured !== 'boolean') throw new Error('Réponse invalide');
      if (!this.destroyed && this.statusController === controller) {
        this.status.set(body.configured ? 'ready' : 'unconfigured');
      }
    } catch {
      if (!this.destroyed && this.statusController === controller) {
        this.status.set('unavailable');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  protected useSuggestion(suggestion: string) {
    this.draft.set(suggestion);
    this.error.set('');
    this.questionInput?.nativeElement.focus();
  }

  protected updateDraft(event: Event) {
    this.draft.set((event.target as HTMLTextAreaElement).value);
    this.error.set('');
  }

  protected async send(event: Event) {
    event.preventDefault();
    const question = this.draft().trim();
    if (this.pending() || this.status() !== 'ready' || !question || question.length > 4000) return;

    const controller = new AbortController();
    this.chatController = controller;
    this.pending.set(true);
    this.pendingQuestion.set(question);
    this.error.set('');
    const timeout = setTimeout(() => controller.abort(), 55000);
    this.scrollToLatest();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationContext(this.messages(), question) }),
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof body.error === 'string' ? body.error : 'Le service est indisponible. Réessayez.',
        );
      }
      if (typeof body.message !== 'string' || !body.message.trim()) {
        throw new Error('La réponse est vide. Réessayez dans un instant.');
      }
      if (this.destroyed || this.chatController !== controller) return;
      this.messages.update((messages) => [
        ...messages,
        { role: 'user', content: question },
        { role: 'assistant', content: body.message.trim() },
      ]);
      this.draft.set('');
    } catch (error) {
      if (this.destroyed || this.chatController !== controller) return;
      this.error.set(
        controller.signal.aborted
          ? 'La réponse prend trop de temps. Votre question est conservée, vous pouvez réessayer.'
          : error instanceof TypeError || error instanceof SyntaxError
            ? 'Impossible de joindre l’assistant. Votre question est conservée, réessayez dans un instant.'
            : error instanceof Error
              ? error.message
              : 'Une erreur est survenue. Réessayez dans un instant.',
      );
    } finally {
      clearTimeout(timeout);
      if (!this.destroyed && this.chatController === controller) {
        this.pending.set(false);
        this.pendingQuestion.set('');
        this.chatController = undefined;
        this.scrollToLatest();
        this.questionInput?.nativeElement.focus();
      }
    }
  }

  protected reset() {
    this.chatController?.abort();
    this.chatController = undefined;
    this.messages.set([]);
    this.draft.set('');
    this.pending.set(false);
    this.pendingQuestion.set('');
    this.error.set('');
    this.questionInput?.nativeElement.focus();
  }

  private scrollToLatest() {
    setTimeout(() => {
      if (this.destroyed) return;
      const element = this.conversation?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }
}
