import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  headerLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  header: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
    lineHeight: 32,
  },
  subheader: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  goal: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCopy: {
    justifyContent: 'center',
    alignItems: 'stretch',
  },
});
