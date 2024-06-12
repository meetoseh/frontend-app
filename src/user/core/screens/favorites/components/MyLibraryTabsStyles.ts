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
    borderBottomWidth: 1,
    borderBottomColor: Colors.PRIMARY_LIGHT,
    paddingTop: 0,
    paddingRight: 2.5,
    paddingBottom: 5,
    paddingLeft: 2.5,
  },
  activeText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  inactive: {
    borderBottomWidth: 0,
    borderBottomColor: Colors.TRANSPARENT,
    paddingTop: 0,
    paddingRight: 2.5,
    paddingBottom: 6,
    paddingLeft: 2.5,
  },
  inactiveText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
