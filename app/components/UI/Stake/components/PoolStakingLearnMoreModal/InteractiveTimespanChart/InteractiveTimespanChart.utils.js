import {
  SMALL_DATASET_GRAPH_INSET,
  SMALL_DATASET_SNAP_RATIO,
  SMALL_DATASET_THRESHOLD,
  STANDARD_DATASET_GRAPH_INSET } from
'./InteractiveTimespanChart.constants';

export const getChartSegmentWidth = (
chartWidth,
dataPoints) =>
parseFloat((chartWidth / dataPoints.length).toFixed(6));

export const calculateSegmentCenters = (
dataPoints,
segmentWidth) =>

dataPoints.map((_, index) => {
  /**
   * Ex. If each segment is 30px wide:
   * The start position of first segment (index: 0) = 0 * segmentWidth OR 0 * 30px = 0
   * The center position of the first segment (index: 0) = startPosition + segmentWidth / 2 OR 0 + 30 / 2 = 15
   */
  const startOfSegment = index * segmentWidth;
  const centerOfSegment = startOfSegment + segmentWidth / 2;
  return centerOfSegment;
});

// Example ISO 8601 timestamp: '2024-11-30T00:00:00.000Z'
export const formatChartDate = (iso8601Timestamp) =>
new Date(iso8601Timestamp).toUTCString().split(' ').slice(0, 4).join(' ');

export const getGraphInsetsByDataPointLength = (numDataPoints) => {
  const graphInsets = {
    insetTop: STANDARD_DATASET_GRAPH_INSET,
    insetBottom: STANDARD_DATASET_GRAPH_INSET
  };

  if (numDataPoints <= 10) {
    graphInsets.insetTop = SMALL_DATASET_GRAPH_INSET;
    graphInsets.insetBottom = SMALL_DATASET_GRAPH_INSET;
    return graphInsets;
  }

  return graphInsets;
};

export const calculateSnapThreshold = (
chartSegmentWidth,
numDataPoints) =>

chartSegmentWidth * (
// We only enable snapping for small datasets.
numDataPoints <= SMALL_DATASET_THRESHOLD ? SMALL_DATASET_SNAP_RATIO : 0);

export const findClosestPointIndex = (
x,
segmentCenters,
snapThreshold,
numDataPoints) =>
{
  // Deselect point when finger raised
  if (x === -1) {
    return -1;
  }

  // Find the closest segment center to the current touch position
  let closestIndex = 0;
  let minDistance = Infinity;

  segmentCenters.forEach((center, index) => {
    const distance = Math.abs(x - center);
    if (distance < minDistance) {
      closestIndex = index;
      minDistance = distance;
    }
  });

  /**
   * Ensure that small datasets respect snap threshold
   * Larger datasets can always update.
   */
  if (minDistance <= snapThreshold || numDataPoints > SMALL_DATASET_THRESHOLD) {
    return closestIndex;
  }

  return -1;
};