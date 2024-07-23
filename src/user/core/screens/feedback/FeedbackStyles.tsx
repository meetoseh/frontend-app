import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  close: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  top: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  header: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
  },
  message: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'left',
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  details: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    textAlign: 'left',
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  inputContainer: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: Colors.NEW_GRAYSCALE_BORDER,
    borderRadius: 28,
    backgroundColor: Colors.GRAYSCALE_BLACK,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexGrow: 1,
    flexShrink: 1,
  },
  input: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
    padding: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
