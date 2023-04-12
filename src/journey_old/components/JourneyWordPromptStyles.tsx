import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  word: {
    alignItems: 'center',
    backgroundColor: Colors.TRANSPARENT_PRIMARY_DEFAULT,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingLeft: 15,
  },
  wordBackground: {
    backgroundColor: Colors.SLIGHTLY_TRANSPARENT_PRIMARY_DEFAULT,
    height: 54,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  wordBackgroundEmpty: {
    display: 'none',
  },
  wordNotFirst: {
    alignItems: 'center',
    backgroundColor: Colors.TRANSPARENT_PRIMARY_DEFAULT,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    paddingLeft: 15,
  },
  wordRow: {
    alignItems: 'stretch',
    flex: 1,
    flexBasis: 54,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'flex-start',
    maxHeight: 54,
  },
  wordRows: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
  },
  wordText: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    paddingLeft: 22,
  },
});
