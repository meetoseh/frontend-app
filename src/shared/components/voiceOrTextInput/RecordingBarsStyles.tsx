import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    overflow: 'hidden',
    top: 0,
    left: 0,
  },
  innerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
