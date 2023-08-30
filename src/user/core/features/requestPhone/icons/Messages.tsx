import { ReactElement } from "react";
import { SvgProps } from "react-native-svg";
import IOSMessages from "./IOSMessages";
import { Platform } from "react-native";
import AndroidMessages from "./AndroidMessages";

const Messages = (props: SvgProps): ReactElement =>
  Platform.select({
    ios: <IOSMessages {...props} />,
    default: <AndroidMessages {...props} />,
  });

export default Messages;
