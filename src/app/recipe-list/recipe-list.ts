import { Component } from '@angular/core';
import { RecipeCard } from '../recipe-card/recipe-card';
import { Recipe, RECIPES } from '../recipe';

@Component({
  selector: 'app-recipe-list',
  imports: [RecipeCard],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css',
})
export class RecipeList {
  protected readonly recipes = RECIPES;
  protected selectedName = '';

  protected open(recipe: Recipe) {
    this.selectedName = recipe.name;
  }
}
