import { Path, Rect, Svg } from 'react-native-svg';

export const RoundMenu = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect width="48" height="48" rx="6" fill="white" fillOpacity="0.01" />
    <Path
      d="M16 30H32C32.55 30 33 29.55 33 29C33 28.45 32.55 28 32 28H16C15.45 28 15 28.45 15 29C15 29.55 15.45 30 16 30ZM16 25H32C32.55 25 33 24.55 33 24C33 23.45 32.55 23 32 23H16C15.45 23 15 23.45 15 24C15 24.55 15.45 25 16 25ZM15 19C15 19.55 15.45 20 16 20H32C32.55 20 33 19.55 33 19C33 18.45 32.55 18 32 18H16C15.45 18 15 18.45 15 19Z"
      fill="#EAEAEB"
    />
  </Svg>
);
