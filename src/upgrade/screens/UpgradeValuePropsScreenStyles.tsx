import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    backgroundColor: Colors.GRAYSCALE_BLACK,
    flex: 1,
    justifyContent: 'center',
  },
  plus: {
    marginLeft: 12,
  },
  price: {
    color: Colors.GRAYSCALE_WHITE,
    fontFamily: 'OpenSans-Italic',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
    marginLeft: 32,
    marginRight: 32,
    marginTop: 24,
    textAlign: 'center',
  },
  valueProp: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  valuePropText: {
    color: Colors.GRAYSCALE_WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    marginLeft: 16,
  },
  valueProps: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 40,
  },
  wordmarkAndPlus: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
