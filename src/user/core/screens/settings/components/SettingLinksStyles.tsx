import { StyleSheet } from 'react-native';
import * as Colors from '../../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    borderRadius: 10,
  },
  item: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  itemFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  itemNotFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  itemLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  itemSpinner: {},
  itemDisabled: {},
  itemPressed: {
    backgroundColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  item_normal: {},
  content: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  details: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  detail: {
    marginTop: 4,
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  text: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
  },
  textDisabled: {},
  text_normal: {
    color: Colors.WHITE,
  },
  actionContainer: {
    minWidth: 20,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
