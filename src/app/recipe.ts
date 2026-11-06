export interface Recipe {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
}

export const RECIPES: Recipe[] = [
  {
    id: '52904',
    name: 'Beef Bourguignon',
    category: 'Beef',
    thumbnail: 'https://www.themealdb.com/images/media/meals/vtqxtu1511784197.jpg',
  },
  {
    id: '52909',
    name: 'Tarte Tatin',
    category: 'Dessert',
    thumbnail: 'https://www.themealdb.com/images/media/meals/ryspuw1511786688.jpg',
  },
  {
    id: '52905',
    name: 'Chocolate Souffle',
    category: 'Dessert',
    thumbnail: 'https://www.themealdb.com/images/media/meals/twspvx1511784937.jpg',
  },
];
