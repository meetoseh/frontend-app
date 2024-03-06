import { Dimensions, LayoutChangeEvent } from 'react-native';

export const debugView =
  (id: string, checklist: boolean = true) =>
  (e: LayoutChangeEvent) => {
    const screenSize = Dimensions.get('screen');
    console.log(
      `${id} is rendering at w=${e.nativeEvent.layout.width} by h=${e.nativeEvent.layout.height} ` +
        `@ (x=${e.nativeEvent.layout.x}, y=${e.nativeEvent.layout.y}). The window size is w=${screenSize.width} by h=${screenSize.height}.`
    );

    if (checklist) {
      console.log(
        'Debug checklist:\n' +
          '- [ ] Is there exactly one StatusBar in the DOM?\n' +
          '- [ ] Is the StatusBar imported from expo-status-bar (not react-native)?\n' +
          '- [ ] Is something causing the status bar height to be included?\n' +
          '  If you render <View style={{ flex: 1 }}><StatusBar /></View>, the height will be less than\n' +
          '  the real screen height. Something needs grow the view to the full screen height\n'
      );
    }
  };
