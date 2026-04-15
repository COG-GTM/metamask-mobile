import {


  Controller as AuthenticationController } from
'@metamask/profile-sync-controller/auth';

export const createAuthenticationController = (props) =>





{
  const authenticationController = new AuthenticationController({
    messenger: props.messenger,
    state: props.initialState,
    metametrics: props.metametrics
  });
  return authenticationController;
};