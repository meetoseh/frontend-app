import { StyleSheet } from 'react-native';
import * as Colors from '../../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 0,
    columnGap: 0,
  },
  active: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    borderBottomWidth: 1,
    borderBottomColor: Colors.PRIMARY_LIGHT,
    color: Colors.PRIMARY_LIGHT,
    paddingTop: 0,
    paddingRight: 2.5,
    paddingBottom: 5,
    paddingLeft: 2.5,
  },
  inactive: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    borderBottomWidth: 0,
    borderBottomColor: Colors.TRANSPARENT,
    color: Colors.GRAYSCALE_MID_GRAY,
    paddingTop: 0,
    paddingRight: 2.5,
    paddingBottom: 6,
    paddingLeft: 2.5,
  },
});
