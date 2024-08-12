import { StyleSheet } from 'react-native';
import { OsehColors } from '../OsehColors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 54,
    backgroundColor: OsehColors.v4.primary.dark,
    borderBottomWidth: 1,
    borderBottomColor: OsehColors.v4.primary.charcoal,
  },
  text: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    textAlign: 'center',
    color: OsehColors.v4.primary.light,
  },
});
