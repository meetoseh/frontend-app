import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: Colors.MORE_TRANSPARENT_WHITE,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    color: Colors.PRIMARY_LIGHT,
    marginBottom: 2,
    borderRadius: 8,
  },
  label: {
    color: Colors.GRAYSCALE_MID_GRAY,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    fontSize: 12,
  },
});
