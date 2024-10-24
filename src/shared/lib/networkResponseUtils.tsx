import { ReactElement } from 'react';
import { Text } from 'react-native';

type NetworkResponseFormatOptions = {
  /**
   * The placeholder to use if the value is null. By default, `null` is
   * interpreted to mean that we fetched the value but it's not applicable,
   * whereas `undefined` means that haven't finished fetching the value yet.
   */
  nullPlaceholder?: ReactElement;

  /**
   * The placeholder to use if the value is undefined. By default, `null` is
   * interpreted to mean that we fetched the value but it's not applicable,
   * whereas `undefined` means that haven't finished fetching the value yet.
   */
  undefinedPlaceholder?: ReactElement;
};

/**
 * Formats a value retrieved from the network, where by default null is
 * interpreted to mean that we fetched the value but it's not applicable,
 * undefined means that haven't finished fetching the value yet, and any other
 * value is interpreted as a valid value.
 *
 * @param value The value to format
 * @param formatter The formatter to use if the value is not null or undefined
 * @param opts Options to customize the formatting
 */
export function formatNetworkValue<T>(
  value: T | null | undefined,
  formatter: (v: T) => ReactElement,
  opts?: NetworkResponseFormatOptions
): ReactElement {
  if (value === null) {
    return opts?.nullPlaceholder ?? <Text>N/A</Text>;
  }

  if (value === undefined) {
    return opts?.undefinedPlaceholder ?? <Text>?</Text>;
  }

  return formatter(value);
}

/**
 * Formats a string received from the network as a fragment containing
 * that string
 *
 * @param str The string to format
 * @param opts Options to customize the formatting
 * @returns The formatted string
 * @see formatNetworkValue
 */
export function formatNetworkString(
  str: string | null | undefined,
  opts?: NetworkResponseFormatOptions
): ReactElement {
  return formatNetworkValue(str, (s) => <Text>{s}</Text>, opts);
}

/**
 * Formats the given number retrieved from the network. See `formatNetworkValue`
 *
 * @param num The number to format
 * @param opts Options to customize the formatting
 * @returns The formatted number
 */
export const formatNetworkNumber = (
  num: number | null | undefined,
  _opts?: NetworkResponseFormatOptions
): ReactElement =>
  formatNetworkValue(num, (n) => <Text>{n.toLocaleString()}</Text>);

/**
 * Formats the given date retrieved from the network. See `formatNetworkValue`
 *
 * @param date The date to format
 * @param opts Options to customize the formatting
 * @returns The formatted date
 */
export const formatNetworkDate = (
  date: Date | null | undefined,
  _opts?: NetworkResponseFormatOptions
): ReactElement =>
  formatNetworkValue(date, (d) => <Text>{d.toLocaleString()}</Text>);

/**
 * Formats a unix timestamp retrieved from the network as a date. See
 * `formatNetworkValue`
 *
 * @param timestamp The timestamp to format
 * @param opts Options to customize the formatting
 * @returns The formatted timestamp
 */
export const formatNetworkUnixTimestamp = (
  timestamp: number | null | undefined,
  opts?: NetworkResponseFormatOptions
): ReactElement =>
  formatNetworkDate(timestamp ? new Date(timestamp * 1000) : null, opts);

export const formatNetworkUnixDate = (
  unixDate: number | null | undefined,
  _opts?: NetworkResponseFormatOptions
): ReactElement => {
  if (unixDate === null || unixDate === undefined) {
    return formatNetworkValue(unixDate, () => <></>);
  }

  const midnightUTC = unixDate * 86400;
  const dateInUTC = new Date(midnightUTC * 1000);
  const year = dateInUTC.getUTCFullYear();
  const month = dateInUTC.getUTCMonth();
  const day = dateInUTC.getUTCDate();

  return formatNetworkString(new Date(year, month, day).toLocaleDateString());
};

/**
 * Formats the given duration in seconds in a human readable way. Typically
 * accessed via formatNetworkDuration.
 *
 * @param seconds The duration in seconds
 * @returns The formatted duration
 */
export const formatDuration = (seconds: number): ReactElement => {
  if (seconds < 2) {
    const ms = Math.round(seconds * 1000);
    return <Text>{ms}ms</Text>;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 2) {
    return <Text>{Math.round(seconds)}s</Text>;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 2) {
    const extraSeconds = Math.round(seconds - minutes * 60);
    return (
      <Text>
        {minutes}m {extraSeconds}s
      </Text>
    );
  }
  return (
    <Text>
      {hours}h {Math.round(minutes - hours * 60)}m
    </Text>
  );
};

/**
 * Formats the given duration as HH:MM:SS.mmm
 * @param seconds The duration in seconds
 * @param opts Options to customize the formatting
 */
export const formatDurationClock = (
  seconds: number,
  opts: {
    /**
     * True to always include hours, false to never include hours,
     * undefined to include hours based on if there are any and
     * includeLeadingZeroParts
     */
    hours?: boolean;
    minutes?: boolean;
    seconds?: boolean;
    milliseconds?: boolean;
    /**
     * True to always include the largest parts, false or undefined
     * to omit leading zero parts. For example, 00:01:02.345 would
     * become 01:02.345 if this is true
     */
    includeLeadingZeroParts?: boolean;
    /**
     * True to always include leading zeroes on the first part, false
     * or undefined to omit leading zeroes on the first part. For example,
     * 01:02:03.456 would become 1:02:03.456 if this is false or undefined
     */
    includeLeadingZeroOnFirstPart?: boolean;
  }
): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const remainingSeconds = Math.floor(seconds - hours * 3600 - minutes * 60);
  const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000);

  const includeHours =
    opts.hours ?? (opts.includeLeadingZeroParts || hours > 0);
  const includeMinutes =
    opts.minutes ??
    (includeHours || opts.includeLeadingZeroParts || minutes > 0);
  const includeSeconds =
    opts.seconds ??
    (includeMinutes || opts.includeLeadingZeroParts || remainingSeconds > 0);
  const includeMilliseconds = opts.milliseconds ?? milliseconds > 0;

  const parts: string[] = [];

  const formatWithLeading = (value: number) =>
    parts.length !== 0 || opts.includeLeadingZeroParts
      ? value.toString().padStart(2, '0')
      : value.toString();

  if (includeHours) {
    parts.push(formatWithLeading(hours));
  }
  if (includeMinutes) {
    parts.push(formatWithLeading(minutes));
  }
  if (includeSeconds) {
    parts.push(formatWithLeading(remainingSeconds));
  }
  if (parts.length === 0) {
    parts.push('0');
  }
  const result = parts.join(':');
  if (includeMilliseconds) {
    return `${result}.${milliseconds.toString().padStart(3, '0')}`;
  }
  return result;
};

/**
 * Formats the given duration in seconds from the network. See
 * `formatNetworkValue`
 *
 * @param seconds The duration in seconds
 * @param opts Options to customize the formatting
 * @returns The formatted duration
 */
export const formatNetworkDuration = (
  seconds: number | null | undefined,
  _opts?: NetworkResponseFormatOptions
): ReactElement => formatNetworkValue(seconds, formatDuration);
