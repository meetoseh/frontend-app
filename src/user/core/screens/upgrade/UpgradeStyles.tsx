import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  top: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  header: {
    textAlign: 'left',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 28,
    color: Colors.WHITE,
  },
  message: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
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
  offers: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  offers2: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  offer: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY_LIGHT,
    borderRadius: 10,
    paddingTop: 12,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    backgroundColor: Colors.TRANSPARENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerActive: {
    backgroundColor: Colors.PRIMARY_LIGHT,
  },
  offerPrice: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    color: Colors.PRIMARY_LIGHT,
  },
  offerPriceActive: {
    color: Colors.GRAYSCALE_BLACK,
  },
  offerFrequency: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    letterSpacing: 0.15,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  offerFrequencyActive: {
    color: Colors.NEW_GRAYSCALE_BORDER,
  },
  disclaimer: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  disclaimerTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    textAlign: 'center',
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  disclaimerBody: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    textAlign: 'center',
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  disclaimerTerms: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    textAlign: 'center',
    color: Colors.GRAYSCALE_MID_GRAY,
    textDecorationLine: 'underline',
    textDecorationColor: Colors.GRAYSCALE_MID_GRAY,
  },
});
