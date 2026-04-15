import { get } from 'lodash';

















// All sortingCallbacks should be asc order, sortAssets function handles asc/dsc
const sortingCallbacks = {
  numeric: (a, b) => a - b,
  stringNumeric: (a, b) =>
  parseFloat((parseFloat(a) - parseFloat(b)).toFixed(5)),
  alphaNumeric: (a, b) => a.localeCompare(b),
  date: (a, b) => a.getTime() - b.getTime()
};

// Utility function to access nested properties by key path
function getNestedValue(obj, keyPath) {
  return get(obj, keyPath);
}

export function sortAssets(
array,
criteria)
{
  const { key, order = 'asc', sortCallback } = criteria;

  return [...array].sort((a, b) => {
    const aValue = getNestedValue(a, key);
    const bValue = getNestedValue(b, key);

    // Always move undefined values to the end, regardless of sort order
    if (aValue === undefined) {
      return 1;
    }

    if (bValue === undefined) {
      return -1;
    }

    let comparison;

    switch (sortCallback) {
      case 'stringNumeric':
      case 'alphaNumeric':
        comparison = sortingCallbacks[sortCallback](
          aValue,
          bValue
        );
        break;
      case 'numeric':
        comparison = sortingCallbacks.numeric(
          aValue,
          bValue
        );
        break;
      case 'date':
        comparison = sortingCallbacks.date(aValue, bValue);
        break;
      default:
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        } else {
          comparison = 0;
        }
    }

    // Modify to sort in ascending or descending order
    return order === 'asc' ? comparison : -comparison;
  });
}