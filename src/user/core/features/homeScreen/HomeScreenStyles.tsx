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
  goal: {
    borderRadius: 72,
    overflow: 'hidden',
  },
  goalInner: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0593914d',
    paddingTop: 14,
    paddingRight: 28,
    paddingBottom: 12,
    paddingLeft: 16,
  },
  goalVisual: {
    position: 'relative',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualForeground: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#44b2a1cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 32,
    color: Colors.PRIMARY_LIGHT,
  },
  goalSection: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  goalSectionTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  goalSectionValue: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
  content: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    flexGrow: 1,
  },
  question: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    paddingHorizontal: 24,
    textAlign: 'center',
    marginTop: 28,
    color: Colors.PRIMARY_LIGHT,
  },
  emotions: {
    justifyContent: 'center',
    alignItems: 'stretch',
    flexGrow: 1,
    gap: 16,
  },
  emotionRow: {
    flexGrow: 0,
  },
  emotionRowContent: {
    columnGap: 16,
    flexGrow: 0,
    justifyContent: 'center',
  },
  emotionButton: {
    borderRadius: 20,
    backgroundColor: '#2c3235',
    paddingVertical: 18,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    minHeight: 60,
  },
  emotionButtonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
    textTransform: 'capitalize',
  },
});