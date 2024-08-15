import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  metadataText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.grey,
  },
  error: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.experimental.lightError,
  },
  selfMessage: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    alignItems: 'center',
    maxWidth: 260,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 16,
    backgroundColor: OsehColors.v4.experimental.lessDarkGrey,
  },
  selfMessageText: {},
  paragraph: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'left',
    color: OsehColors.v4.primary.light,
  },
  reflectionQuestionText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: OsehColors.v4.primary.light,
  },
  reflectionResponseText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
});
