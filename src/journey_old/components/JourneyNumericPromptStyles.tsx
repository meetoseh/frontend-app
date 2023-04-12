import { StyleSheet, ViewStyle } from 'react-native';
import * as Colors from '../../styling/colors';

const option: ViewStyle = {
  flexBasis: 75,
  height: 75,
  maxHeight: 75,
  maxWidth: 75,
  minHeight: 75,
  minWidth: 75,
  width: 75,
  backgroundColor: Colors.HALF_TRANSPARENT_WHITE,
  borderRadius: 75 / 2,
  overflow: 'hidden',
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0.4,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: Colors.WHITE,
};
export const styles = StyleSheet.create({
  averageMood: {
    alignSelf: 'center',
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 16,
    lineHeight: 16,
    marginTop: 32,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  option,
  optionBackground: {
    backgroundColor: Colors.WHITE,
    bottom: 0,
    left: 0,
    position: 'absolute',
    width: 75,
  },
  optionNotFirst: Object.assign({}, option, { marginLeft: 20 }),
  optionText: {
    color: Colors.GRAYSCALE_BLACK,
    fontFamily: 'OpenSans-Regular',
    fontSize: 34,
  },
  optionsContainer: {
    flex: 1,
    flexBasis: 75,
    flexDirection: 'row',
    height: 75,
    marginTop: 32,
    maxHeight: 75,
    minHeight: 75,
    overflow: 'hidden',
  },
});
