import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  footer: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 9,
    lineHeight: 12,
    marginLeft: 19,
  },
  lineContainer: {
    marginBottom: 97,
  },
  previewContainer: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    borderRadius: 15,
    flex: 1,
    flexDirection: 'column',
    height: 357,
    justifyContent: 'flex-start',
    maxHeight: 357,
    width: 208,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 20,
        shadowColor: Colors.BLACK,
      },
    }),
  },
  previewImageStyle: {
    borderRadius: 15,
  },
  previewInstructor: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-LightItalic',
    fontSize: 12,
    lineHeight: 12,
    marginBottom: 12,
    marginLeft: 19,
    marginRight: 19,
  },
  previewTitle: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 3,
    marginLeft: 19,
    marginRight: 19,
    marginTop: 28,
  },
  shareClassLinkContainer: {
    alignSelf: 'stretch',
    marginTop: 32,
    paddingLeft: 24,
    paddingRight: 24,
  },
  shareVideoContainer: {
    alignSelf: 'stretch',
    marginTop: 60,
    paddingLeft: 24,
    paddingRight: 24,
  },
  soundWaveContainer: {
    alignSelf: 'center',
    marginBottom: 110,
  },
});
