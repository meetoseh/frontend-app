import { StyleSheet } from 'react-native';
import { OsehColors } from '../OsehColors';

export const styles = StyleSheet.create({
  simpleWrapper: {
    borderWidth: 1,
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  simpleText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
    padding: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
  },
  textareaWrapper: {
    paddingTop: 16,
    paddingRight: 0,
    paddingBottom: 16,
    paddingLeft: 16,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  textareaText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
    padding: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  submit: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
});
