import {

  TraceName,
  TraceOperation,
  trace } from
'../../util/trace';

let UIStartupSpan;

const getUIStartupSpan = (startTime) => {
  if (!UIStartupSpan) {
    UIStartupSpan = trace({
      name: TraceName.UIStartup,
      startTime,
      op: TraceOperation.UIStartup
    });
  }

  return UIStartupSpan;
};

export default getUIStartupSpan;