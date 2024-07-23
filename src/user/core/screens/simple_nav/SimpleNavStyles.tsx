import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  close: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  primary: {},
  primaryText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 32,
    color: Colors.PRIMARY_LIGHT,
  },
  secondary: {
    paddingVertical: 4,
  },
  secondaryText: {
    fontFamily: 'OpenSans-REgular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
});
