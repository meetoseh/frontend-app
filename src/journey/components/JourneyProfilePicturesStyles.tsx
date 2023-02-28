import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  bonusUsersText: {
    color: Colors.BLACK,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    maxHeight: 38,
    paddingLeft: 24,
    paddingRight: 24,
  },
  pictureContainer: {
    alignItems: 'center',
    backgroundColor: Colors.GRAYSCALE_LIGHT_GRAY,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 38,
  },
  pictureContainerNotFirst: {
    alignItems: 'center',
    backgroundColor: Colors.GRAYSCALE_LIGHT_GRAY,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    marginLeft: -6,
    overflow: 'hidden',
    width: 38,
  },
});
