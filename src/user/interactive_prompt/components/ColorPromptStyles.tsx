import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  prompt: {
    marginTop: 40,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  colors: {
    marginTop: 36,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  colorRowNotFirstChild: {
    marginTop: 32,
  },
  color: {},
  colorNotFirstChild: {
    marginLeft: 32,
  },
  continueContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 0,
    paddingLeft: 24,
  },
  profilePictures: {
    marginTop: 20,
    alignSelf: 'center',
  },
});
