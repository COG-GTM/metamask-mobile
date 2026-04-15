import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RegionsService, ServicesSignatures } from '@consensys/on-ramp-sdk';
import { useRampSDK, SDK } from '../sdk';
import Logger from '../../../../util/Logger';


// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any




/**
 * Determines if the provided method and parameters are valid for the RegionsService interface.
 * @param method - The method to check the parameters against.
 * @param params - The parameters to check against the RegionsService interface.
 * @returns A boolean indicating whether or not the provided parameters are valid for the specified method.
 */
function validMethodParams(
method,
params)
{
  const parameters =

  ServicesSignatures.RegionsService[method].parameters;
  return parameters.every(({ required }, index) => {
    if (!required) return true;

    return params[index] != null;
  });
}

/**
 * Determines if the provided method is called with all its parameters.
 * @param method - The method to check the parameters against.
 * @param params - The parameters to check against the RegionsService interface.
 * @returns A boolean indicating whether or not the provided parameters are all the parameters of the specified method.
 */
function hasAllParams(
method,
params)
{
  const { parameters } = SDK.getSignature(
    RegionsService,
    RegionsService.prototype[method]
  );

  return parameters.length === params.length;
}






/**
 * useSDKMethod is a hook to conveniently call OnRampSdk.regions methods.
 *
 * @param config The method name or an object with the method name and a boolean onMount flag.
 * @param params The parameters to pass to the method.
 * @returns An array with an object with data, an error and a loading flag, and a function to call the method.
 *
 * @example
 * // Calling `getDefaultFiatCurrency` method
 * const [{ isFetching, error, data }] = useSDKMethod('getDefaultFiatCurrency', '/regions/cl');
 *
 * @example
 * // Calling `getDefaultFiatCurrency` method and get the function
 * const [{ isFetching, error, data }, getDefaultFiatCurrency] = useSDKMethod('getDefaultFiatCurrency', '/regions/cl');
 * // `getDefaultFiatCurrency` will be called with the same parameters
 * // by default (`/regions/cl` in this case)
 * const defaultCLFiatCurrency = await getDefaultFiatCurrency();
 * // Parameters can be overridden
 * const defaultARFiatCurrency = await getDefaultFiatCurrency('/regions/ar');
 * // The return and error of these calls will be reflected in the returned object of the hook
 */
export default function useSDKMethod(
config,
...params)











{
  const method = typeof config === 'string' ? config : config.method;
  const onMount = typeof config === 'string' ? true : config.onMount ?? true;

  const { sdk } = useRampSDK();
  const [data, setData] = useState(

    null);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(onMount);
  const stringifiedParams = useMemo(() => JSON.stringify(params), [params]);
  const abortControllerRef = useRef();

  const query = useCallback(
    async (...customParams) => {
      const hasCustomParams = customParams.length > 0;
      const queryParams = hasCustomParams ? customParams : params;

      if (!validMethodParams(method, queryParams)) {
        return;
      }

      const hasEveryParameter = hasAllParams(method, queryParams);
      let abortController;

      try {
        abortControllerRef?.current?.abort();

        if (!hasEveryParameter) {
          abortController = new AbortController();
          abortControllerRef.current = abortController;
        }

        setIsFetching(true);
        setError(null);
        setData(null);

        if (sdk) {
          const methodParams = abortController ?
          [...queryParams, abortController] :
          queryParams;
          const response = await sdk[method](
            // @ts-expect-error spreading params error
            ...methodParams
          );
          setData(response);
          setIsFetching(false);

          return response;
        }
      } catch (responseError) {
        if (abortController?.signal.aborted) {
          return;
        }

        Logger.error(responseError, `useSDKMethod::${method} failed`);
        setError(responseError.message);
        setIsFetching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, stringifiedParams, sdk]
  );

  useEffect(() => {
    if (onMount) {
      query();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [query, onMount]);

  return [{ data, error, isFetching }, query];
}