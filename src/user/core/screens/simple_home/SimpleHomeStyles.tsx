import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  roundMenuWrapper: {
    paddingLeft: 24,
    paddingTop: 8,
  },
  favoritesWrapper: {
    paddingRight: 24,
    paddingTop: 8,
  },
  headline: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
    textAlign: 'left',
  },
  goal: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  subheadline: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
    textAlign: 'left',
  },
  subheadlineQuote: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
    textAlign: 'left',
  },
  subheadlineAuthor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
    textAlign: 'left',
  },
});
