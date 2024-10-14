import { StyleSheet } from 'react-native';
import { OsehColors } from '../../OsehColors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
    minHeight: 60,
    flexGrow: 1,
    flexBasis: 0,
  },
});
