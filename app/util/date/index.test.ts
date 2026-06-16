import {
  msBetweenDates,
  msToHours,
  toDateFormat,
  formatTimestampToYYYYMMDD,
  getTimeDifferenceFromNow,
  toRelativeTime,
} from '.';
import { SECOND, MINUTE, HOUR, DAY, WEEK } from '../../constants/time';

const TZ = 'America/Toronto';

describe('Date', () => {
  describe('toDateFormat', () => {
    it('should be America/Toronto timeZone', () => {
      // we're explicitly setting TZ in `jest.config.js`
      // this test is to verify that
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(TZ);
    });
    it('should format date correctly', () => {
      // if TZ is not 'America/Toronto' the following test cases will fail
      expect(toDateFormat(1592877684000)).toBe('Jun 22 at 10:01 pm');
      expect(toDateFormat(1592877340000)).toBe('Jun 22 at 9:55 pm');
      expect(toDateFormat(1592850067000)).toBe('Jun 22 at 2:21 pm');
      expect(toDateFormat(1615308615000)).toBe('Mar 9 at 11:50 am');
      expect(toDateFormat(1615308108000)).toBe('Mar 9 at 11:41 am');
      // this was previously rendering as 0:28 pm:
      expect(toDateFormat(1615912139000)).toBe('Mar 16 at 12:28 pm');
      expect(toDateFormat(1592883929000)).toBe('Jun 22 at 11:45 pm');
      expect(toDateFormat(1592883518000)).toBe('Jun 22 at 11:38 pm');
      expect(toDateFormat(1592882817000)).toBe('Jun 22 at 11:26 pm');
      expect(toDateFormat(1592881746000)).toBe('Jun 22 at 11:09 pm');
      expect(toDateFormat(1592879617000)).toBe('Jun 22 at 10:33 pm');
      expect(toDateFormat(1592879267000)).toBe('Jun 22 at 10:27 pm');
      expect(toDateFormat(1592879146000)).toBe('Jun 22 at 10:25 pm');
      expect(toDateFormat(1592878450000)).toBe('Jun 22 at 10:14 pm');
    });
  });
});

describe('Date util :: msBetweenDates', () => {
  it('should return 1000', () => {
    const DateReal = global.Date;

    const mockDate = new Date();
    const spy = jest
      .spyOn(global, 'Date')
      .mockImplementation(function (
        ...args: ConstructorParameters<typeof DateReal>
      ) {
        if (args.length) {
          return new DateReal(...args);
        }
        return mockDate;
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

    const todayOneHourEarlier = new Date().getTime() - 1000;
    const dateOneHourEarlier = new Date(todayOneHourEarlier);

    expect(msBetweenDates(dateOneHourEarlier)).toEqual(1000);
    spy.mockClear();
  });
});

describe('Date util :: msToHours', () => {
  it('should return 1', () => {
    expect(msToHours(1000 * 60 * 60)).toEqual(1);
  });
});

describe('Date util :: formatTimestampToYYYYMMDD', () => {
  it('should format timestamp', () => {
    const testTimestamp = 1722432060;
    const date = new Date(testTimestamp * 1000).getTime();
    expect(formatTimestampToYYYYMMDD(date)).toEqual('2024-07-31');
  });
});

describe('Date util :: getDaysAndHoursRemaining', () => {
  // 2024-09-24 19:19:41
  const MOCK_NOW = 1727205581107;

  const mockDateNow = jest.spyOn(Date, 'now');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('returns time difference between timestamp and now', () => {
    mockDateNow.mockImplementation(() => MOCK_NOW);

    // 2024-09-29 23:54:41 (5 days, 4 hours, and 35 minutes after MOCK_NOW)
    const TIMESTAMP = 1727654081107;

    const { days, hours, minutes } = getTimeDifferenceFromNow(
      Number(TIMESTAMP),
    );

    expect(days).toBe(5);
    expect(hours).toBe(4);
    expect(minutes).toBe(35);
  });

  it('returns correct value when timestamp and current time are identical', () => {
    mockDateNow.mockImplementation(() => MOCK_NOW);

    const { days, hours, minutes } = getTimeDifferenceFromNow(Number(MOCK_NOW));

    expect(days).toBe(0);
    expect(hours).toBe(0);
    expect(minutes).toBe(0);
  });

  it('returns default value when timestamp passed in is in the past', () => {
    // 2024-09-21 19:19:41 (3 days before MOCK_NOW)
    const TIMESTAMP = 1726946381107;

    mockDateNow.mockImplementation(() => MOCK_NOW);

    const { days, hours, minutes } = getTimeDifferenceFromNow(
      Number(TIMESTAMP),
    );

    expect(days).toBe(0);
    expect(hours).toBe(0);
    expect(minutes).toBe(0);
  });
});

describe('Date util :: toRelativeTime', () => {
  const RELATIVE_MONTH = DAY * 30;
  const RELATIVE_YEAR = DAY * 365;
  const NOW = 1727205581107;

  const relative = (offsetMs: number) =>
    toRelativeTime(NOW - offsetMs, { now: NOW });

  it('renders "Just now" for very recent timestamps', () => {
    expect(relative(0)).toBe('Just now');
    expect(relative(SECOND * 5)).toBe('Just now');
    // Anything under the 30s threshold is "Just now".
    expect(relative(SECOND * 29)).toBe('Just now');
  });

  it('renders "Just now" for near-future timestamps within the threshold', () => {
    expect(relative(-SECOND * 10)).toBe('Just now');
  });

  describe('past timestamps', () => {
    it('renders minutes', () => {
      expect(relative(MINUTE)).toBe('1 minute ago');
      expect(relative(MINUTE * 5)).toBe('5 minutes ago');
      expect(relative(MINUTE * 59)).toBe('59 minutes ago');
    });

    it('renders hours', () => {
      expect(relative(HOUR)).toBe('1 hour ago');
      expect(relative(HOUR * 2)).toBe('2 hours ago');
      expect(relative(HOUR * 23)).toBe('23 hours ago');
    });

    it('renders days', () => {
      expect(relative(DAY)).toBe('1 day ago');
      expect(relative(DAY * 6)).toBe('6 days ago');
    });

    it('renders weeks', () => {
      expect(relative(WEEK)).toBe('1 week ago');
      expect(relative(WEEK * 3)).toBe('3 weeks ago');
    });

    it('renders months', () => {
      expect(relative(RELATIVE_MONTH)).toBe('1 month ago');
      expect(relative(RELATIVE_MONTH * 6)).toBe('6 months ago');
    });

    it('renders years', () => {
      expect(relative(RELATIVE_YEAR)).toBe('1 year ago');
      expect(relative(RELATIVE_YEAR * 2)).toBe('2 years ago');
    });
  });

  describe('future timestamps', () => {
    it('renders minutes', () => {
      expect(relative(-MINUTE)).toBe('in 1 minute');
      expect(relative(-MINUTE * 10)).toBe('in 10 minutes');
    });

    it('renders hours', () => {
      expect(relative(-HOUR * 3)).toBe('in 3 hours');
    });

    it('renders days', () => {
      expect(relative(-DAY * 2)).toBe('in 2 days');
    });

    it('renders years', () => {
      expect(relative(-RELATIVE_YEAR)).toBe('in 1 year');
    });
  });

  it('accepts a Date object as input', () => {
    expect(toRelativeTime(new Date(NOW - HOUR * 4), { now: NOW })).toBe(
      '4 hours ago',
    );
  });

  it('uses Date.now() when no reference time is provided', () => {
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => NOW);
    expect(toRelativeTime(NOW - DAY * 3)).toBe('3 days ago');
    spy.mockRestore();
  });

  it('returns the unknown string for invalid input', () => {
    expect(toRelativeTime(NaN, { now: NOW })).toBe('Unknown');
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(toRelativeTime('not-a-date' as any, { now: NOW })).toBe('Unknown');
  });
});
