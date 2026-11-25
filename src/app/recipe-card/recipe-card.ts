import { UpperCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Recipe } from '../recipe';
import { TruncatePipe } from '../truncate-pipe';

@Component({
  selector: 'app-recipe-card',
  imports: [UpperCasePipe, TruncatePipe],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  readonly isFavorite = input(false);
  readonly selected = output<Recipe>();
  readonly favoriteToggled = output<string>();

  protected select() {
    this.selected.emit(this.recipe());
  }

  protected toggleFavorite() {
    this.favoriteToggled.emit(this.recipe().id);
  }
}
