import { StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 0,
  },
  labelContainer: {
    paddingTop: 22,
    paddingLeft: 20,
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.PRIMARY_LIGHT,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
    backgroundColor: Colors.GRAYSCALE_BLACK_BACKGROUND,
    borderRadius: 4,
  },
  closeButtonContainer: {
    flexGrow: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  closeButtonPressableContainer: {
    paddingTop: 11,
    paddingRight: 19,
    paddingLeft: 19,
    paddingBottom: 8,
  },
  closeButtonInnerContainer: {
    padding: 5,
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
    borderRadius: 7.5,
  },
  closeButtonInnerContainerAssumeDark: {
    backgroundColor: 'transparent',
  },
  playContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  playButtonInner: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContents: {
    paddingTop: 24,
    /** 8-right must be added by children, to allow the buttons to pad their pressable area */
    paddingRight: 16,
    paddingBottom: 24,
    /* 3-left must be added by children, to allow the transcript to align the text, not the background */
    paddingLeft: 21,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  transcriptContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 8,
  },
  transcriptPhraseWrapper: {
    padding: 3,
    borderRadius: 3,
    backgroundColor: Colors.GRAYSCALE_BLACK_BACKGROUND,
  },
  transcriptPhrase: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 3,
  },
  infoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  instructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  title: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  tagContainer: {
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 3,
    paddingBottom: 3,
    backgroundColor: '#383a34',
    borderRadius: 4,
    marginTop: 5,
  },
  tag: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  buttonsContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  buttonIconsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
  },
  buttonNotFirst: {
    marginLeft: 8,
  },
  buttonCTARow: {
    marginTop: 16,
  },
  ctaInner: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
    paddingRight: 8,
  },
  progressFull: {
    height: 3,
    backgroundColor: Colors.PRIMARY_LIGHT,
    flexGrow: 0,
    flexShrink: 0,
  },
  progressDot: {
    width: 8,
    height: 8,
    marginLeft: -4,
    marginRight: -4,
    borderRadius: 4,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: Colors.PRIMARY_LIGHT,
  },
  progressEmpty: {
    height: 3,
    backgroundColor: Colors.MORE_TRANSPARENT_WHITE,
    flexGrow: 1,
  },
  durationContainer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTime: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  totalTime: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
