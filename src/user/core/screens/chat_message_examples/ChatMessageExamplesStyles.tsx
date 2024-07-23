import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
  },
  body: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  messageEvenContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  messageOddContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  message: {
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 260,
    padding: 16,
    backgroundColor: Colors.GRAYSCALE_DARKENED_BACKGROUND,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 0.3333333,
    borderStyle: 'solid',
    borderColor: Colors.COLORFUL_EMPHASIZE_BORDER,
  },
  messageText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
});
