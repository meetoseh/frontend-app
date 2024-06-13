import { ReactElement } from 'react';
import { styles } from './GridBlackBackgroundStyles';
import { View } from 'react-native';

/**
 * An element which fills the background using grid-area: 1 / 1 / -1 / -1
 * and has a black background.
 */
export const GridBlackBackground = (): ReactElement => (
  <View style={styles.container} />
);
