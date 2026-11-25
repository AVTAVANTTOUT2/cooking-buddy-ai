import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryList } from './category-list';

describe('CategoryList', () => {
  let fixture: ComponentFixture<CategoryList>;
  let buttons: HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryList],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryList);
    fixture.componentRef.setInput('categories', ['Beef', 'Dessert']);
    await fixture.whenStable();
    buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
  });

  it('renders one button per category', () => {
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Beef', 'Dessert']);
  });

  it('emits the clicked category', () => {
    let emitted: string | undefined;
    fixture.componentInstance.categorySelected.subscribe((category) => (emitted = category));

    buttons[1].click();

    expect(emitted).toBe('Dessert');
  });
});
