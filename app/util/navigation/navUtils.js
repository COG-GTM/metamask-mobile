/* eslint-disable @typescript-eslint/ban-types */
import { useMemo } from 'react';
import { useRoute } from '@react-navigation/native';






export const createNavigationDetails =
(name, screen) =>
(params) =>
[name, screen ? { screen, params } : params];


export const useParams = (



defaults) =>
{
  const route = useRoute();
  const navParams = route.params;
  const params = useMemo(
    () => ({ ...defaults, ...navParams }),
    [defaults, navParams]
  );
  return params;
};