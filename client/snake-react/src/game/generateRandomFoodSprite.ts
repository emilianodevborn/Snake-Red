export const generateRandomFoodSprite = () => {
  const fruits = [
    'apple',
    'cherry',
    'lemon',
    'mushroom',
    'orange',
    'strawberry',
    'watermelon',
    'goldenApple'
  ];
  const index = Math.floor(Math.random() * fruits.length);
  return fruits[index];
};
