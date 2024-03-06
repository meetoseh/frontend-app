import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  topNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingLeft: 32,
    /* On the right, we want the padding on the favorites to be clickable,
       but not shift the text */
    paddingRight: 32 - 26,
    paddingTop: 32,
  },
  profilePic: {
    borderRadius: 22.5,
    marginRight: 10,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsMessages: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.15,
    color: Colors.WHITE,
  },
  greetingAction: {
    fontFamily: 'OpenSans-Italic',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.15,
    color: Colors.WHITE,
  },
  favoritesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12.5,
    paddingBottom: 12.5,
    paddingLeft: 25,
    paddingRight: 25,
  },
  favoritesLinkText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.WHITE,
  },
  questionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    lineHeight: 32,
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 85,
    marginBottom: 27,
    marginLeft: 16,
    marginRight: 16,
    textAlign: 'center',
  },
  words: {
    position: 'relative',
  },
  wordText: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  wordPressable: {
    paddingTop: 12,
    paddingRight: 14,
    paddingBottom: 9,
    paddingLeft: 14,
  },
  votesView: {
    position: 'absolute',
    left: 0,
    top: 0,
    margin: 0,
    padding: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 9,
  },
  votesText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    lineHeight: 12,
    color: Colors.WHITE,
    margin: 0,
    padding: 0,
  },
  profilePicturesContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  takeMeToClassContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
  },
});
