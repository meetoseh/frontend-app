import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  innerContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexGrow: 1,
    paddingTop: 0,
  },
  profile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 36,
  },
  profilePicture: {
    borderRadius: 22.5,
    overflow: 'hidden',
    marginRight: 12,
  },
  profileName: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    letterSpacing: 0.15,
    color: Colors.WHITISH_BLUE,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  tab: {},
  tabNotFirstChild: {
    marginLeft: 40,
  },
  activeTab: {
    borderBottomColor: Colors.GRAYSCALE_WHITE,
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    paddingBottom: 6,
  },
  tabText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    lineHeight: 32,
    color: Colors.HALF_TRANSPARENT_WHITISH_BLUE,
  },
  activeTabText: {
    color: Colors.GRAYSCALE_WHITE,
  },
  tabContent: {
    marginTop: 24,
  },
  tabContentCourses: {},
});
