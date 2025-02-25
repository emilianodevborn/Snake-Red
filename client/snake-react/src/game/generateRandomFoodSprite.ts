import lemon from "../assets/lemon.svg";
import orange from "../assets/orange.svg";

export const generateRandomFoodSprite = () => {
  const image = new Image();
  const random = Math.random();

  image.src = random < 0.5 ? orange : lemon;

  return image;
};
