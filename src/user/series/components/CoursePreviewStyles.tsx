import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  closeButtonContainer: {},
  closeButtonInnerContainer: {},
  closeButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausePlayControlContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausePlayControlLoaded: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {},
  footerInnerContainer: {},
  transcript: {},
  infoAndActions: {},
  info: {},
  instructor: {},
  title: {},
  numClasses: {},
  actions: {},
  actionIconsRow: {},
  actionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsContent: {},
  progressContainer: {},
  progressFull: {},
  progressDot: {},
  progressEmpty: {},
  durationContainer: {},
  currentTime: {},
  totalTime: {},
});
