import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  contentContainer: {},
  content: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  closeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    paddingRight: 0,
  },
  closeButton: {
    paddingTop: 8,
    paddingLeft: 24,
    paddingRight: 32,
    paddingBottom: 16,
  },
  contentInnerContainer: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
  },
  contentInner: {
    alignSelf: 'center',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
  },
  instructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    padding: 8,
    marginRight: -8,
  },
  description: {
    marginTop: 24,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  upgradeContainer: {
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  classes: {
    marginTop: 24,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  classesTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  classList: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    marginTop: 8,
    gap: 8,
  },
  classesPlaceholder: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  classButton: {
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
