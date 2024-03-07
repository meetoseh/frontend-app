import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

const partiallyObscuredBottomHeight = Platform.select({
  ios: 12, // notch on iphone x
  default: 0,
});

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#191c1d',
    minHeight: 67 + partiallyObscuredBottomHeight,
    paddingBottom: partiallyObscuredBottomHeight,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  itemWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  itemWrapperActive: {},
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    overflow: 'visible',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: Colors.WHITE,
  },
  labelActive: {},
});
