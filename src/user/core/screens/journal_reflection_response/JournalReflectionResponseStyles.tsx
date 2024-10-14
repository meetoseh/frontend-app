import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  questionError: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: OsehColors.v4.experimental.lightError,
  },
  errorLink: {
    textDecorationLine: 'underline',
    textDecorationColor: OsehColors.v4.experimental.lightError,
  },
  question: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: OsehColors.v4.primary.light,
  },
  responseText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
  spinner: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  done: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  buttonInner: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  voiceNoteWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 260,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 16,
    backgroundColor: '#35383a',
  },
});
