import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 17,
    zIndex: 100,
  },

  containerDisabled: {},
  containerPressed: {},
  // used to ensure at least 48x48 touchable area
  paddingStyle: {
    paddingBottom: 21,
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 13,
  },
});
