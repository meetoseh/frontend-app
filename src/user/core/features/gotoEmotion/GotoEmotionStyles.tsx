import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {},
  backButtonContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    paddingTop: 12,
    paddingRight: 30,
    paddingBottom: 12,
    paddingLeft: 14,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 28,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
  },
  emotion: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 28,
    textAlign: 'center',
    color: Colors.WHITE,
    textTransform: 'capitalize',
    padding: 8,
    textShadowColor: '#ffffff80',
    textShadowRadius: 16,
  },
  socialProof: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  socialProofMessage: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  socialProofPictures: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    paddingVertical: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
});
