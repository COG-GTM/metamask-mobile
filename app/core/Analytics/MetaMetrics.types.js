


/**
 * Segment client restricted to the interface used by MetaMetrics
 */


/**
 * MetaMetrics core interface
 */
























































/**
 * represents values that can be passed as properties to the event tracking function
 * It's a proxy type to the JsonValue type from Segment SDK in order to decouple the SDK from the app
 */









/**
 * represents the map object used to pass properties to the event tracking function
 * It's a proxy type to the JsonMap type from Segment SDK in order to decouple the SDK from the app
 */





/**
 * type guard to check if the event is a new ITrackingEvent
 */
export const isTrackingEvent = (
event) =>

event.saveDataRecording !== undefined;

/*
 * new event properties structure with two distinct properties lists
 */








/**
 * legacy MetaMetrics event interface
 */








/**
 * deletion task possible status
 * @see https://docs.segmentapis.com/tag/Deletion-and-Suppression#operation/getRegulation
 */
export let DataDeleteStatus = /*#__PURE__*/function (DataDeleteStatus) {DataDeleteStatus["failed"] = "FAILED";DataDeleteStatus["finished"] = "FINISHED";DataDeleteStatus["initialized"] = "INITIALIZED";DataDeleteStatus["invalid"] = "INVALID";DataDeleteStatus["notSupported"] = "NOT_SUPPORTED";DataDeleteStatus["partialSuccess"] = "PARTIAL_SUCCESS";DataDeleteStatus["running"] = "RUNNING";DataDeleteStatus["unknown"] = "UNKNOWN";return DataDeleteStatus;}({});










/**
 * deletion task possible response status
 */
export let DataDeleteResponseStatus = /*#__PURE__*/function (DataDeleteResponseStatus) {DataDeleteResponseStatus["ok"] = "ok";DataDeleteResponseStatus["error"] = "error";return DataDeleteResponseStatus;}({});