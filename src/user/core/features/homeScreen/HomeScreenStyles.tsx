import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  backgroundOverlay: {
    flexGrow: 1,
  },
  foreground: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerAndGoal: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 54,
    paddingRight: 24,
    paddingBottom: 0,
    paddingLeft: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    textAlign: 'left',
    flexGrow: 1,
    color: Colors.PRIMARY_LIGHT,
  },
  headerProfilePicture: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfilePictureImg: {
    borderRadius: 16,
  },
  headerBody: {
    marginTop: 12,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  headerBodyStrong: {
    fontFamily: 'OpenSans-SemiBold',
  },
  goalWrapper: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexGrow: 1,
  },
});
