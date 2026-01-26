import { strings } from '../../../locales/i18n';
import { MINUTE, HOUR, DAY } from '../../constants/time';

interface TimeDifference {
  days: number;
  hours: number;
  minutes: number;
}

export function toLocaleDateTime(timestamp: number): string {
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString();
  const time = dateObj.toLocaleTimeString();
  return `${date} ${time}`;
}

export function toDateFormat(timestamp: number): string {
  const date = new Date(timestamp);
  const month = strings(`date.months.${date.getMonth()}`);
  const day = date.getDate();
  let hours = date.getHours();
  let minutes: number | string = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${month} ${day} ${strings(
    'date.connector',
  )} ${hours}:${minutes} ${ampm}`;
}

export function toLocaleDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function toLocaleTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function msBetweenDates(date: Date): number {
  const today = new Date();
  return Math.abs(date.getTime() - today.getTime());
}

export function msToHours(milliseconds: number): number {
  return milliseconds / (60 * 60 * 1000);
}

export const formatTimestampToYYYYMMDD = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTimeDifferenceFromNow = (timestamp: number): TimeDifference => {
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
