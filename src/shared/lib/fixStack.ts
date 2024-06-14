import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isDevelopment = Constants.expoConfig?.extra?.environment === 'dev';

/**
 * Attempts to cleanup a stack trace so it can automatically be de-obfuscated
 */
export const fixStack = async (
  stack: string | undefined
): Promise<string | undefined> => {
  if (!isDevelopment) {
    return stack;
  }

  if (stack === undefined) {
    return undefined;
  }

  return await Platform.select({
    ios: async () => {
      const bundles: Map<string, string[]> = new Map();
      const badBundles = new Set<string>();
      const resultLines = [];

      // at NAME (https://oseh-dev.com:1900/path&query:line:column)
      const lineFmt = /^\s*at\s*([^ ]+)\s*\((http:\/\/.+):(\d+):(\d+)\)$/;
      for (const srcLine of stack.split('\n')) {
        const match = lineFmt.exec(srcLine);
        if (match === null) {
          resultLines.push(srcLine);
          continue;
        }

        const [, name, originalUrl, line, column] = match;
        if (!bundles.has(originalUrl) && !badBundles.has(originalUrl)) {
          const url = originalUrl.replace(/http:\/\//, 'https://');
          console.log('downloading bundle @ ', url);
          try {
            const response = await fetch(url);
            if (response.ok) {
              const source = await response.text();
              console.log('finished downloading bundle @ ', originalUrl);
              bundles.set(originalUrl, source.split('\n'));
            } else {
              console.warn(
                `Failed to load source information @ ${originalUrl} due to status code ${response.status}`
              );
              resultLines.push(srcLine);
              badBundles.add(originalUrl);
              continue;
            }
          } catch (e) {
            console.warn(
              `Failed to load source information @ ${originalUrl} due to error: ${e}`
            );
            resultLines.push(srcLine);
            badBundles.add(originalUrl);
            continue;
          }
        }

        const src = bundles.get(originalUrl);
        if (src === undefined) {
          resultLines.push(srcLine);
          continue;
        }

        const lineIdx = parseInt(line, 10) - 1;
        const originalLine = src[lineIdx];
        if (originalLine === undefined) {
          resultLines.push(srcLine);
          continue;
        }

        const originalColumn = parseInt(column, 10);
        resultLines.push(`    at ${name} (${originalUrl}:${line}:${column})`);
        for (let i = -3; i < 0; i++) {
          if (lineIdx + i < 0) {
            continue;
          }
          resultLines.push(`    ${src[lineIdx + i]}`);
        }
        resultLines.push(`    ${originalLine}`);
        resultLines.push(`    ${' '.repeat(originalColumn)}^`);
        for (let i = 1; i <= 3; i++) {
          if (lineIdx + i >= src.length) {
            break;
          }
          resultLines.push(`    ${src[lineIdx + i]}`);
        }
      }

      console.log('finished with stack');
      return resultLines.join('\n');
    },
    default: async () => stack,
  })();
};
