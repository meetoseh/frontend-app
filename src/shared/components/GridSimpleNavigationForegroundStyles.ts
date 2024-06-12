import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: Colors.GRAYSCALE_BLACK,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
  },
});
