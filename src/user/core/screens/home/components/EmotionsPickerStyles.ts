import { StyleSheet } from 'react-native';
import * as Colors from '../../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 324,
  },
  row: {
    flexGrow: 0,
  },
  rowContent: {
    gap: 0,
    columnGap: 0,
    justifyContent: 'center',
  },
  rowContentInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 20,
    backgroundColor: '#2c3235',
    paddingRight: 24,
    paddingLeft: 24,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
    textTransform: 'capitalize',
  },
  question: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
  },
});
