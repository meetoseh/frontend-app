import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    backgroundColor: OsehColors.v4.primary.dark,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: OsehColors.v4.primary.charcoal,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  xWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  headerText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    textAlign: 'center',
    color: OsehColors.v4.primary.light,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  chatAreaContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  chatAreaContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  systemMessage: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  systemMessageTextWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 30,
    flexGrow: 1,
    flexShrink: 1,
  },
  systemMessageText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'left',
    color: OsehColors.v4.primary.light,
  },
  paragraph: {},
  journeyCard: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  journeyCardTop: {
    height: 120,
    position: 'relative',
  },
  journeyCardTopBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  journeyCardTopForeground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 16,
  },
  journeyCardTopForegroundPaid: {
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
    backgroundColor: OsehColors.v4.primary.dark + '80',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  journeyCardTopForegroundPaidText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.light,
  },
  journeyCardTopForegroundTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: OsehColors.v4.primary.light,
  },
  journeyCardTopForegroundInstructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.smoke,
  },
  journeyCardBottom: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: OsehColors.v4.primary.dark,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingTop: 14.5,
    paddingRight: 16,
    paddingBottom: 14.5,
    paddingLeft: 16,
  },
  journeyCardInfo: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 16.8,
    color: OsehColors.v4.primary.grey,
  },
  selfMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    maxWidth: 260,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 2,
    backgroundColor: OsehColors.v4.experimental.lessDarkGrey,
  },
  selfMessageTextWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  selfMessageText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'left',
    color: OsehColors.v4.primary.light,
  },
  hint: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    textAlign: 'center',
    color: OsehColors.v4.primary.grey,
  },
  suggestions: {
    flexGrow: 0,
    flexShrink: 0,
  },
  suggestionsContent: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  suggestion: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.darkGrey,
    backgroundColor: OsehColors.v4.primary.dark,
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 12,
  },
  suggestionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    textAlign: 'left',
    color: OsehColors.v4.primary.light,
  },
  form: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  inputWrapper: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
    paddingTop: 10,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 16,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  input: {
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
    paddingTop: 7,
    paddingRight: 8,
    paddingBottom: 5,
    paddingLeft: 4,
  },
});
