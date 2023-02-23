import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardBehind: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
  },
  cardInFront: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
