import { Dimensions, StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

const fontScale = Dimensions.get('window').fontScale;

export const styles = StyleSheet.create({
  instructions: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: OsehColors.v4.primary.smoke,
    maxWidth: 13 * 16 * fontScale, // 13em
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    textAlign: 'center',
    color: OsehColors.v4.primary.light,
  },
  body: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: OsehColors.v4.primary.smoke,
    maxWidth: 15 * 16 * fontScale, // 15em
    alignSelf: 'center',
  },
  image: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
