import { Dimensions, LayoutChangeEvent } from 'react-native';
import { getBotBarHeight } from '../hooks/useBotBarHeight';

export const debugView =
  (id: string, checklist: boolean = true) =>
  (e: LayoutChangeEvent) => {
    const screenSize = Dimensions.get('screen');
    const windowSize = Dimensions.get('window');
    const botBarHeight = getBotBarHeight();
    console.log(
      `${id} is rendering at w=${e.nativeEvent.layout.width} by h=${e.nativeEvent.layout.height} ` +
        `@ (x=${e.nativeEvent.layout.x}, y=${e.nativeEvent.layout.y}). The screen size is w=${screenSize.width} by h=${screenSize.height}. ` +
        `The window size is w=${windowSize.width} by h=${windowSize.height}. The window is ` +
        `w=${screenSize.width - windowSize.width} by h=${
          screenSize.height - windowSize.height
        } ` +
        `smaller than the screen. The bottom bar is ${botBarHeight}px, meaning the ` +
        `top bar is ${screenSize.height - windowSize.height - botBarHeight}px. `
    );

    if (checklist) {
      console.log(
        'Debug checklist:\n' +
          '- [ ] Is there exactly one StatusBar in the DOM?\n' +
          '- [ ] Is the StatusBar imported from expo-status-bar (not react-native)?\n' +
          '- [ ] Is something causing the status bar height to be included?\n' +
          '  If you render <View style={{ flex: 1 }}><StatusBar /></View>, the height will be less than\n' +
          '  the real screen height. Something needs grow the view to the full screen height\n' +
          '- [ ] Are you using justifyContent: "space-between" with height or min-height set on a column-direction container?\n' +
          '      If you do so, it may automatically adjust the flex basis to the height PLUS the height of the children,\n' +
          '      which is basically never what you want. Set flexBasis: 0 to fix this.\n'
      );
    }
  };
