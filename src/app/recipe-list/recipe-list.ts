import { Component } from '@angular/core';
import { CategoryList } from '../category-list/category-list';
import { Panel } from '../panel/panel';
import { RecipeCard } from '../recipe-card/recipe-card';
import { Recipe, RECIPES } from '../recipe';

@Component({
  selector: 'app-recipe-list',
  imports: [CategoryList, Panel, RecipeCard],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css',
})
export class RecipeList {
  protected readonly recipes = RECIPES;
  protected readonly categories = [...new Set(RECIPES.map((recipe) => recipe.category))];
  protected selectedName = '';
  protected selectedCategory = '';

  protected open(recipe: Recipe) {
    this.selectedName = recipe.name;
  }

  protected selectCategory(category: string) {
    this.selectedCategory = category;
  }
}
