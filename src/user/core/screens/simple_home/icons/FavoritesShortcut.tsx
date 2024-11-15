import { Circle, Path, Svg } from 'react-native-svg';

export const FavoritesShortcut = () => (
  <Svg width="48" height="48" viewBox="0 1 48 48" fill="none">
    <Circle cx="24" cy="25" r="16" fill="white" fillOpacity="0.35" />
    <Path
      d="M24 32L22.84 30.9929C18.72 27.43 16 25.0725 16 22.1962C16 19.8387 17.936 18 20.4 18C21.792 18 23.128 18.618 24 19.5869C24.872 18.618 26.208 18 27.6 18C30.064 18 32 19.8387 32 22.1962C32 25.0725 29.28 27.43 25.16 30.9929L24 32Z"
      fill="white"
    />
  </Svg>
);
