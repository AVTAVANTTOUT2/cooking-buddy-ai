import { Component, input, output } from '@angular/core';
import { Recipe } from '../recipe';

@Component({
  selector: 'app-recipe-card',
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  readonly selected = output<Recipe>();

  protected select() {
    this.selected.emit(this.recipe());
  }
}
