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
  tooltipContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    padding: 16,
    backgroundColor: Colors.PRIMARY_LIGHT,
    borderRadius: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tooltipHeader: {
    textAlign: 'left',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: Colors.GRAYSCALE_BLACK,
  },
  tooltipBody: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_BLACK,
  },
  cta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  ctaInner: {
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
});
