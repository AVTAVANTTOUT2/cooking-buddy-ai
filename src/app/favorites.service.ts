import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly favoriteIds = signal<ReadonlySet<string>>(new Set());
  readonly favoriteCount = computed(() => this.favoriteIds().size);

  isFavorite(recipeId: string): boolean {
    return this.favoriteIds().has(recipeId);
  }

  toggleFavorite(recipeId: string): void {
    this.favoriteIds.update((ids) => {
      const updatedIds = new Set(ids);
      if (updatedIds.has(recipeId)) {
        updatedIds.delete(recipeId);
      } else {
        updatedIds.add(recipeId);
      }
      return updatedIds;
    });
  }
}
