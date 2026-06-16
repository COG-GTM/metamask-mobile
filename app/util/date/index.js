import { strings } from '../../../locales/i18n';
import { SECOND, MINUTE, HOUR, DAY, WEEK } from '../../constants/time';

// Approximations used only for human-friendly relative-time display.
const RELATIVE_MONTH = DAY * 30;
const RELATIVE_YEAR = DAY * 365;

// Differences smaller than this are rendered as "just now".
const JUST_NOW_THRESHOLD = SECOND * 30;

/**
 * Ordered (largest first) list of units used to pick the most significant
 * unit when building a relative-time string.
 */
const RELATIVE_TIME_UNITS = [
  { unit: 'year', ms: RELATIVE_YEAR },
  { unit: 'month', ms: RELATIVE_MONTH },
  { unit: 'week', ms: WEEK },
  { unit: 'day', ms: DAY },
  { unit: 'hour', ms: HOUR },
  { unit: 'minute', ms: MINUTE },
];

export function toLocaleDateTime(timestamp) {
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString();
  const time = dateObj.toLocaleTimeString();
  return `${date} ${time}`;
}

export function toDateFormat(timestamp) {
  const date = new Date(timestamp);
  const month = strings(`date.months.${date.getMonth()}`);
  const day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${month} ${day} ${strings(
    'date.connector',
  )} ${hours}:${minutes} ${ampm}`;
}

export function toLocaleDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

export function toLocaleTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * This function will return the difference between today and a provided date in milliseconds
 * @param {Date} sessionTime - Date object
 * @returns the difference between two dates in milliseconds
 */
export function msBetweenDates(date) {
  const today = new Date();
  return Math.abs(date.getTime() - today.getTime());
}

/**
 * This function will return how many hours in on a determinated amount of milliseconds
 * @param {number} milliseconds - Milliseconds number
 * @returns how many hours in on a determinated amount of milliseconds
 */
export function msToHours(milliseconds) {
  return milliseconds / (60 * 60 * 1000);
}

/**
 * this function will convert a timestamp to the 'yyyy-MM-dd' format
 * @param {*} timestamp timestamp you wish to convert in milliseconds
 * @returns formatted date yyyy-MM-dd
 */
export const formatTimestampToYYYYMMDD = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns an object containing the difference in days, hours, and minutes between a now and a future timestamp.
 *
 * @param {number} timestamp - The timestamp in the future to compare to now.
 *
 * @returns object with difference in amount of days, hours, and minutes. If timestamp is in the past, a default value of { days: 0, hours: 0, minutes: 0 } is returned.
 */
export const getTimeDifferenceFromNow = (timestamp) => {
  const currentTime = Date.now();

  // Default when timestamp is in the past.
  if (timestamp < currentTime) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const differenceInMilliseconds = timestamp - currentTime;

  const days = Math.floor(differenceInMilliseconds / DAY);
  const hours = Math.floor((differenceInMilliseconds % DAY) / HOUR);
  const minutes = Math.floor((differenceInMilliseconds % HOUR) / MINUTE);

  return { days, hours, minutes };
};

/**
 * Formats a timestamp into a localized, human-friendly relative-time string,
 * e.g. "Just now", "5 minutes ago" or "in 2 hours".
 *
 * The most significant unit is used (years, months, weeks, days, hours or
 * minutes). Differences smaller than 30 seconds are rendered as "Just now".
 * Future timestamps produce forward-looking strings (e.g. "in 3 days").
 *
 * @param {number|Date} timestamp - Timestamp in milliseconds or a Date object.
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.now] - Reference "now" in milliseconds. Defaults to Date.now().
 * @returns {string} Localized relative-time string.
 */
export const toRelativeTime = (timestamp, options = {}) => {
  const time =
    timestamp instanceof Date ? timestamp.getTime() : Number(timestamp);

  if (!Number.isFinite(time)) {
    return strings('date.relative.unknown');
  }

  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const difference = now - time;
  const isPast = difference >= 0;
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference < JUST_NOW_THRESHOLD) {
    return strings('date.relative.just_now');
  }

  const tense = isPast ? 'past' : 'future';

  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (absoluteDifference >= ms) {
      const count = Math.floor(absoluteDifference / ms);
      const plural = count === 1 ? 'one' : 'other';
      return strings(`date.relative.${tense}.${unit}_${plural}`, { count });
    }
  }

  return strings('date.relative.just_now');
};
