import { BrowserAuthError } from '@azure/msal-browser';
import { MessageBarType } from '@fluentui/react';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { authenticationWrapper } from '../../../modules/authentication';
import { getConsentAuthErrorHint } from '../../../modules/authentication/authentication-error-hints';
import { AppDispatch } from '../../../store';
import { AuthenticateResult } from '../../../types/authentication';
import { Mode } from '../../../types/enums';
import { ApplicationState } from '../../../types/root';
import { translateMessage } from '../../utils/translate-messages';
import { fetchAllPrincipalGrants } from '../actions/permissions-action-creator';
import { getProfileInfo } from './profile.slice';
import { setQueryResponseStatus } from './query-status.slice';

const initialState: AuthenticateResult = {
  authToken: {
    pending: false,
    token: false
  },
  consentedScopes: []
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    getAuthTokenSuccess(state) {
      state.authToken.token = true;
      state.authToken.pending = false;
    },
    signOutSuccess(state) {
      state.authToken.token = false;
      state.authToken.pending = false;
      state.consentedScopes = [];
    },
    setAuthenticationPending(state) {
      state.authToken.token = true;
      state.authToken.pending = true;
    },
    getConsentedScopesSuccess(state, action: PayloadAction<string[]>) {
      state.consentedScopes = action.payload;
    }
  }
});

export const { getAuthTokenSuccess, signOutSuccess,
  setAuthenticationPending, getConsentedScopesSuccess } = authSlice.actions;

export function signOut() {
  return (dispatch: AppDispatch, getState: Function) => {
    const state = getState() as ApplicationState;
    const { graphExplorerMode } = state;
    dispatch(setAuthenticationPending());
    if (graphExplorerMode === Mode.Complete) {
      authenticationWrapper.logOut();
    } else {
      authenticationWrapper.logOutPopUp();
    }
    dispatch(signOutSuccess());
  };
}

const validateConsentedScopes = (scopeToBeConsented: string[], consentedScopes: string[],
  consentedResponse: string[]) => {
  if (!consentedScopes || !consentedResponse || !scopeToBeConsented) {
    return consentedResponse;
  }
  const expectedScopes = [...consentedScopes, ...scopeToBeConsented];
  if (expectedScopes.length === consentedResponse.length) {
    return consentedResponse;
  }
  return expectedScopes;
}

export const consentToScopes = createAsyncThunk(
  'auth/consentToScopes',
  async (scopes: string[], { dispatch, getState }) => {
    try {
      const { profile, auth: { consentedScopes } } = getState() as ApplicationState;
      const authResponse = await authenticationWrapper.consentToScopes(scopes);
      if (authResponse && authResponse.accessToken) {
        dispatch(getAuthTokenSuccess());
        const validatedScopes = validateConsentedScopes(scopes, consentedScopes, authResponse.scopes);
        dispatch(getConsentedScopesSuccess(validatedScopes));
        if (
          authResponse.account &&
          authResponse.account.localAccountId !== profile?.user?.id
        ) {
          dispatch(getProfileInfo());
        }
        dispatch(
          setQueryResponseStatus({
            statusText: translateMessage('Success'),
            status: translateMessage('Scope consent successful'),
            ok: true,
            messageType: MessageBarType.success
          })
        );
        dispatch(fetchAllPrincipalGrants());
      }
    } catch (error: unknown) {
      const { errorCode } = error as BrowserAuthError;
      dispatch(
        setQueryResponseStatus({
          statusText: translateMessage('Scope consent failed'),
          status: errorCode,
          ok: false,
          messageType: MessageBarType.error,
          hint: getConsentAuthErrorHint(errorCode)
        })
      );
    }
  }
);

export function signIn() {
  return (dispatch: AppDispatch) => dispatch(getAuthTokenSuccess());
}

export function storeScopes(consentedScopes: string[]) {
  return (dispatch: AppDispatch) => dispatch(getConsentedScopesSuccess(consentedScopes));
}

export default authSlice.reducer;
