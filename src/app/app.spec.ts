import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('CookingBuddy');
  });

  it('updates the shared favorite count and toggles the same recipe back to zero', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const count = () => page.querySelector('.favorite-count')?.textContent?.trim();
    const favorite = page.querySelector<HTMLButtonElement>('button.favorite');

    expect(count()).toBe('Favoris : 0');
    expect(favorite).not.toBeNull();
    favorite!.click();
    await fixture.whenStable();
    expect(count()).toBe('Favoris : 1');
    expect(favorite!.getAttribute('aria-pressed')).toBe('true');
    expect(page.textContent).not.toContain('Selected recipe:');

    favorite!.click();
    await fixture.whenStable();
    expect(count()).toBe('Favoris : 0');
    expect(favorite!.getAttribute('aria-pressed')).toBe('false');
  });

  it('counts different favorite recipes independently', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const buttons = page.querySelectorAll<HTMLButtonElement>('button.favorite');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    buttons[0].click();
    buttons[1].click();
    await fixture.whenStable();
    expect(page.querySelector('.favorite-count')?.textContent?.trim()).toBe('Favoris : 2');

    buttons[0].click();
    await fixture.whenStable();
    expect(page.querySelector('.favorite-count')?.textContent?.trim()).toBe('Favoris : 1');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
