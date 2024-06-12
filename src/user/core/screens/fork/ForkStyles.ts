import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  message: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  options: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    borderRadius: 10,
  },
  option: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionNotFirst: {
    borderTopColor: Colors.NEW_GRAYSCALE_BORDER,
    borderTopWidth: 1,
  },
  optionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
});
