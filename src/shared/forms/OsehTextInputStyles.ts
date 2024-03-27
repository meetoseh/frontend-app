import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: 10,
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  input: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    paddingTop: 5,
    paddingBottom: 5,
  },
  placeholder: {
    color: Colors.GRAYSCALE_DISABLED,
  },
});
