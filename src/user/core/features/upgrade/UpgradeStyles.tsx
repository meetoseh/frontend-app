import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {},
  contentContainer: {},
  content: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    position: 'relative',
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  belowImageBackground: {
    flexGrow: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  closeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 0,
    paddingRight: 0,
  },
  closeButton: {
    paddingTop: 8,
    paddingRight: 24,
    paddingLeft: 32,
    paddingBottom: 16,
  },
  contentInnerContainer: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  contentInner: {
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 28,
    textAlign: 'left',
    color: Colors.WHITE,
  },
  valueProps: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  valueProp: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  valuePropIcon: {
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: 24,
    height: 24,
    fontSize: 17,
  },
  valuePropIconEmoji: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
  },
  valuePropText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    textAlign: 'left',
    color: Colors.PRIMARY_LIGHT,
  },
  offers: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    marginTop: 40,
    gap: 12,
  },
  offers2: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 40,
  },
  offer: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: Colors.PRIMARY_LIGHT,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offer2: {
    flexBasis: 1,
    flexGrow: 1,
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
  subscribeContainer: {
    alignItems: 'stretch',
    marginTop: 24,
  },
  disclaimer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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
});
