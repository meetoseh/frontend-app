import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  empty: {
    backgroundColor: Colors.TRANSPARENT_WHITE,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 34,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    color: Colors.WHITE,
  },
  tabsWrapper: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
});
