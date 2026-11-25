import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeCard } from './recipe-card';

describe('RecipeCard', () => {
  let component: RecipeCard;
  let fixture: ComponentFixture<RecipeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeCard],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCard);
    fixture.componentRef.setInput('recipe', {
      id: 'test-soupe',
      name: 'Soupe de légumes',
      category: 'Vegetarian',
      thumbnail: '/test-recipe.jpg',
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the recipe id through favoriteToggled without selecting the recipe', () => {
    const favoriteToggled = vi.fn();
    const selected = vi.fn();
    component.favoriteToggled.subscribe(favoriteToggled);
    component.selected.subscribe(selected);

    fixture.nativeElement.querySelector('button.favorite').click();

    expect(favoriteToggled).toHaveBeenCalledExactlyOnceWith('test-soupe');
    expect(selected).not.toHaveBeenCalled();
  });

  it('still selects the recipe from the main card button without toggling favorites', () => {
    const selected = vi.fn();
    const favoriteToggled = vi.fn();
    component.selected.subscribe(selected);
    component.favoriteToggled.subscribe(favoriteToggled);

    fixture.nativeElement.querySelector('button.recipe-select').click();

    expect(selected).toHaveBeenCalledExactlyOnceWith(component.recipe());
    expect(favoriteToggled).not.toHaveBeenCalled();
  });
});
