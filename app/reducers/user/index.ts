import { createSlice } from '@reduxjs/toolkit';
import {
  UserActionType,
  type LoadingSetAction,
  type SetAppThemeAction,
} from '../../actions/user/types';
import { AppThemeKey } from '../../util/theme/models';
import { UserState } from './types';

export * from './types';

export * from './selectors';

/**
 * Initial user state
 */
export const userInitialState: UserState = {
  loadingMsg: '',
  loadingSet: false,
  passwordSet: false,
  seedphraseBackedUp: false,
  backUpSeedphraseVisible: false,
  protectWalletModalVisible: false,
  gasEducationCarouselSeen: false,
  userLoggedIn: false,
  isAuthChecked: false,
  initialScreen: '',
  appTheme: AppThemeKey.os,
  ambiguousAddressEntries: {},
  appServicesReady: false,
};

export const initialState = userInitialState;

/**
 * User slice. Legacy action types are handled in `extraReducers` so the
 * existing action creators in `app/actions/user` keep their exact shape.
 * Case reducers return a new object (as the legacy switch did) so reference
 * semantics stay identical.
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(UserActionType.LOGIN, (state) => ({
        ...state,
        userLoggedIn: true,
      }))
      .addCase(UserActionType.LOGOUT, (state) => ({
        ...state,
        userLoggedIn: false,
      }))
      .addCase(
        UserActionType.LOADING_SET,
        (state, action: LoadingSetAction) => ({
          ...state,
          loadingSet: true,
          loadingMsg: action.loadingMsg,
        }),
      )
      .addCase(UserActionType.LOADING_UNSET, (state) => ({
        ...state,
        loadingSet: false,
      }))
      .addCase(UserActionType.PASSWORD_SET, (state) => ({
        ...state,
        passwordSet: true,
      }))
      .addCase(UserActionType.PASSWORD_UNSET, (state) => ({
        ...state,
        passwordSet: false,
      }))
      .addCase(UserActionType.SEEDPHRASE_NOT_BACKED_UP, (state) => ({
        ...state,
        seedphraseBackedUp: false,
        backUpSeedphraseVisible: true,
      }))
      .addCase(UserActionType.SEEDPHRASE_BACKED_UP, (state) => ({
        ...state,
        seedphraseBackedUp: true,
        backUpSeedphraseVisible: false,
      }))
      .addCase(UserActionType.BACK_UP_SEEDPHRASE_VISIBLE, (state) => ({
        ...state,
        backUpSeedphraseVisible: true,
      }))
      .addCase(UserActionType.BACK_UP_SEEDPHRASE_NOT_VISIBLE, (state) => ({
        ...state,
        backUpSeedphraseVisible: false,
      }))
      .addCase(UserActionType.PROTECT_MODAL_VISIBLE, (state) => {
        if (!state.seedphraseBackedUp) {
          return {
            ...state,
            protectWalletModalVisible: true,
          };
        }
        return state;
      })
      .addCase(UserActionType.PROTECT_MODAL_NOT_VISIBLE, (state) => ({
        ...state,
        protectWalletModalVisible: false,
      }))
      .addCase(UserActionType.SET_GAS_EDUCATION_CAROUSEL_SEEN, (state) => ({
        ...state,
        gasEducationCarouselSeen: true,
      }))
      .addCase(
        UserActionType.SET_APP_THEME,
        (state, action: SetAppThemeAction) => ({
          ...state,
          appTheme: action.payload.theme,
        }),
      )
      .addCase(UserActionType.SET_APP_SERVICES_READY, (state) => ({
        ...state,
        appServicesReady: true,
      }));
  },
});

/**
 * User reducer
 */
const userReducer = userSlice.reducer;
export default userReducer;
