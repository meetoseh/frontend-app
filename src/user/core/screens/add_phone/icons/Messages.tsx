import { Platform } from 'react-native';
import AndroidMessages from './AndroidMessages';
import IOSMessages from './IOSMessages';

const Messages = Platform.select({
  ios: IOSMessages,
  default: AndroidMessages,
});

export default Messages;
