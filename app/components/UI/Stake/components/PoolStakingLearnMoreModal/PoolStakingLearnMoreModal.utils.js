
import { strings } from '../../../../../../locales/i18n';

export const parseVaultApyAveragesResponse = (
vaultTimespanAprs) =>
{
  const numDaysMap =


  {
    oneDay: { numDays: 1, label: strings('stake.today') },
    oneWeek: { numDays: 7, label: strings('stake.one_week_average') },
    oneMonth: { numDays: 30, label: strings('stake.one_month_average') },
    threeMonths: { numDays: 90, label: strings('stake.three_month_average') },
    sixMonths: { numDays: 180, label: strings('stake.six_month_average') },
    oneYear: { numDays: 365, label: strings('stake.one_year_average') }
  };

  return Object.entries(vaultTimespanAprs).reduce(

    (map, [key, value]) => {
      const numDaysMapEntry = numDaysMap[key];
      map[numDaysMapEntry.numDays] = { apyAverage: value, ...numDaysMapEntry };
      return map;
    }, {});
};