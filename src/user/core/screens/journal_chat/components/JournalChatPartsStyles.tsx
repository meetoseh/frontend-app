import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  author__self: {
    maxWidth: 260,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 16,
    backgroundColor: '#35383a',
    alignSelf: 'flex-end',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  type__ui: {
    maxWidth: undefined,
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  author__other: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  tag: {
    backgroundColor: OsehColors.v4.experimental.lighten5,
    borderRadius: 10,
  },
});
