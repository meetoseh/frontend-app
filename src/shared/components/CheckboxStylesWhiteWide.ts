import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    color: Colors.GRAYSCALE_WHITE,
    fontSize: 14,
    lineHeight: 21,
  },
  iconContainer: {},
  icon: {
    width: 24,
    height: 24,
  },
});
