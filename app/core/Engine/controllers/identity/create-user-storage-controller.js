import {


  Controller as UserStorageController } from
'@metamask/profile-sync-controller/user-storage';

export const createUserStorageController = (props) =>







{
  const userStorageController = new UserStorageController({
    messenger: props.messenger,
    state: props.initialState,
    nativeScryptCrypto: props.nativeScryptCrypto,
    config: props.config,
    env: props.env
  });
  return userStorageController;
};