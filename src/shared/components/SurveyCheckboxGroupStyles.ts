import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    borderRadius: 10,
  },
  itemNotFirstChild: {
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  checkboxContainer: {
    padding: 12,
  },
});
