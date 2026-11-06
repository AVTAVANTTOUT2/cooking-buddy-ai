import { Component } from '@angular/core';
import { Header } from './header/header';
import { RecipeList } from './recipe-list/recipe-list';

@Component({
  selector: 'app-root',
  imports: [Header, RecipeList],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
