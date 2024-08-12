import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  backWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
  },
  instructor: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  description: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  numClasses: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  classes: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  journey: {
    position: 'relative',
    minHeight: 80,
    backgroundColor: Colors.BLACK,
    borderRadius: 10,
    overflow: 'hidden',
  },
  journeyForeground: {
    paddingTop: 16,
    paddingRight: 12,
    paddingBottom: 16,
    paddingLeft: 12,
    alignItems: 'stretch',
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyHeaderLeft: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  journeyHeaderRight: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  journeyCounterWrapper: {
    minWidth: 24,
    paddingLeft: 2,
    paddingRight: 2,
    textAlign: 'center',
  },
  journeyCounterText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  journeyTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  journeyPlayedText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  journeyDurationWrapper: {
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
    backgroundColor: '#191c1d80',
    borderRadius: 4,
  },
  journeyDurationText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.PRIMARY_LIGHT,
  },
  journeyDescription: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.PRIMARY_LIGHT,
  },
  heartWrapper: {
    padding: 6,
  },
});
