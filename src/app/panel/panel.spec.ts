import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `<app-panel heading="Recipes"><p>Projected content</p></app-panel>`,
})
class Host {}

describe('Panel', () => {
  it('renders the heading, then the projected content', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const section: HTMLElement = fixture.nativeElement.querySelector('section');

    expect(section.querySelector('h2')?.textContent).toBe('Recipes');
    expect(section.querySelector('h2 + p')?.textContent).toBe('Projected content');
  });
});
