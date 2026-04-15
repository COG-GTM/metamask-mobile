import { useEffect, useState } from 'react';


import { MM_APP_CONFIG_URL } from '../../../constants/urls';


const initialState = {
  type: 'Loading'
};

const useAppConfig = (hasGithubPermissions) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const fetchAppConfig = () => {
      if (hasGithubPermissions) {
        fetch(MM_APP_CONFIG_URL).
        then((response) => response.json()).
        then((data) => {
          try {
            const minimumVersions = data.security.minimumVersions;
            const appConfig = {
              security: {
                minimumVersions: {
                  appMinimumBuild: minimumVersions.appMinimumBuild,
                  appleMinimumOS: minimumVersions.appleMinimumOS,
                  androidMinimumAPIVersion:
                  minimumVersions.androidMinimumAPIVersion
                }
              }
            };
            setState({ type: 'Success', data: appConfig });
            // TODO: Replace "any" with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (e) {
            setState({
              type: 'Error',
              error: e,
              message: `error parsing AppConfig ${e.message}`
            });
          }
        })
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((e) => {
          setState({
            type: 'Error',
            error: e,
            message: `error fetching AppConfig ${e.message}`
          });
        });
      } else {
        setState({
          type: 'Error',
          message: `GitHub request permissions not granted by user. See hasUserSelectedAutomaticSecurityCheckOption global state`
        });
      }
    };

    fetchAppConfig();
  }, [hasGithubPermissions]);

  return state;
};

export default useAppConfig;