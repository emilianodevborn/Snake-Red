import lemon from "../assets/lemon.svg";
import orange from "../assets/orange.svg";

export const generateRandomFoodSprite = () => {
  const random = Math.random();

  return random < 0.5 ? orange : lemon;
};
