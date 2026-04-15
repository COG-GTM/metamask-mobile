var




DecodingResponseType = /*#__PURE__*/function (DecodingResponseType) {DecodingResponseType["Change"] = "CHANGE";DecodingResponseType["NoChange"] = "NO_CHANGE";DecodingResponseType["Loading"] = "decoding_in_progress";return DecodingResponseType;}(DecodingResponseType || {});





export const getSignatureDecodingEventProps = (
decodingData,
decodingLoading,
isDecodingAPIEnabled = false) =>
{
  if (!isDecodingAPIEnabled || !decodingData) {
    return {};
  }

  const { stateChanges, error } = decodingData;

  const changeTypes = (stateChanges ?? []).map(
    (change) => change.changeType
  );

  const responseType =
  error?.type ?? (
  changeTypes.length ?
  DecodingResponseType.Change :
  DecodingResponseType.NoChange);

  return {
    decoding_change_types: changeTypes,
    decoding_description: decodingData?.error?.message ?? null,
    decoding_response: decodingLoading ?
    DecodingResponseType.Loading :
    responseType
  };
};