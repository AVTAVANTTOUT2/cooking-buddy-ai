import { Component } from '@angular/core';
import { Header } from './header/header';
import { RecipeList } from './recipe-list/recipe-list';
import { Chatbot } from './chatbot/chatbot';

@Component({
  selector: 'app-root',
  imports: [Header, RecipeList, Chatbot],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
