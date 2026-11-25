import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chatbot } from './chatbot';

describe('Chatbot', () => {
  let fixture: ComponentFixture<Chatbot>;
  let fetchMock: ReturnType<typeof vi.fn>;

  const response = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  beforeEach(async () => {
    fetchMock = vi.fn().mockResolvedValue(response({ configured: true }));
    vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({ imports: [Chatbot] }).compileComponents();
    fixture = TestBed.createComponent(Chatbot);
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element('.status')).toBeNull();
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  function element<T extends Element = HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  async function submit(question: string) {
    const input = element<HTMLTextAreaElement>('textarea');
    input.value = question;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    element('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
  }

  it('sends conversation history, displays answers as text, and clears the successful draft', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: '<strong>Une omelette.</strong>' }));
    await submit('Que faire avec des œufs ?');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element('.conversation').textContent).toContain('<strong>Une omelette.</strong>');
    });
    expect(element('.conversation strong')).toBeNull();
    expect(element<HTMLTextAreaElement>('textarea').value).toBe('');

    fetchMock.mockResolvedValueOnce(response({ message: 'Ajoutez du persil.' }));
    await submit('Et pour relever le goût ?');
    const payload = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(payload.messages).toEqual([
      { role: 'user', content: 'Que faire avec des œufs ?' },
      { role: 'assistant', content: '<strong>Une omelette.</strong>' },
      { role: 'user', content: 'Et pour relever le goût ?' },
    ]);
  });

  it('retains the question after an error and retries without duplicating history', async () => {
    fetchMock.mockResolvedValueOnce(response({ error: 'Service occupé. Réessayez.' }, 429));
    await submit('Une recette rapide ?');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element('[role="alert"]').textContent).toContain('Service occupé');
    });
    expect(element<HTMLTextAreaElement>('textarea').value).toBe('Une recette rapide ?');
    expect(element<HTMLButtonElement>('.send').disabled).toBe(false);

    fetchMock.mockResolvedValueOnce(response({ message: 'Essayez une salade.' }));
    element('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).messages).toEqual([
      { role: 'user', content: 'Une recette rapide ?' },
    ]);
  });

  it('prevents duplicate submissions and ignores a late response after resetting', async () => {
    let resolveRequest!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    await submit('Un dessert ?');
    const requestSignal = fetchMock.mock.calls[1][1].signal as AbortSignal;
    expect(element<HTMLButtonElement>('.send').disabled).toBe(true);
    element('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    element<HTMLButtonElement>('.reset').click();
    await fixture.whenStable();
    expect(requestSignal.aborted).toBe(true);
    resolveRequest(response({ message: 'Cette réponse arrive trop tard.' }));
    await fixture.whenStable();
    expect(element('.conversation').textContent).not.toContain('Cette réponse arrive trop tard');
    expect(element('.conversation').textContent).not.toContain('Un dessert ?');
    expect(element<HTMLTextAreaElement>('textarea').value).toBe('');
  });

  it('rejects empty and oversized messages before making a request', async () => {
    await submit('   ');
    await submit('x'.repeat(4001));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('allows the configuration status to be checked again', async () => {
    fixture.destroy();
    fetchMock.mockResolvedValueOnce(response({ configured: false }));
    fixture = TestBed.createComponent(Chatbot);
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element('.status').textContent).toContain('pas encore configuré');
    });
    await submit('Bonjour');
    expect(element<HTMLButtonElement>('.send').disabled).toBe(true);

    fetchMock.mockResolvedValueOnce(response({ configured: true }));
    element<HTMLButtonElement>('.text-button').click();
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element('.status')).toBeNull();
    });
    expect(element<HTMLButtonElement>('.send').disabled).toBe(false);
  });
});
