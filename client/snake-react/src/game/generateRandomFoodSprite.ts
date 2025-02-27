export const generateRandomFoodSprite = () => {
  const random = Math.random();

  return random < 0.5 ? 'orange' : 'lemon';
};
