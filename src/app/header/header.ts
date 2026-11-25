import { Component, inject } from '@angular/core';
import { FavoritesService } from '../favorites.service';

@Component({
  imports: [],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected readonly favorites = inject(FavoritesService);
}
