import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  statusDetails: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  statusDetailsLink: {
    fontFamily: 'OpenSans-SemiBold',
    textDecorationColor: Colors.GRAYSCALE_MID_GRAY,
    textDecorationLine: 'underline',
  },
  lifetimePropsTitle: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 28,
    textAlign: 'left',
    color: Colors.WHITE,
  },
  valueProp: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  valuePropText: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  storeInfoTitle: {
    textAlign: 'left',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  storeInfo: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  storeInfoLink: {
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.PRIMARY_LIGHT,
    textDecorationColor: Colors.PRIMARY_LIGHT,
    textDecorationLine: 'underline',
  },
});
