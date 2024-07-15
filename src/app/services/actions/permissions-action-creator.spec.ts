import configureMockStore from 'redux-mock-store';

import { AnyAction } from '@reduxjs/toolkit';
import {
  FETCH_FULL_SCOPES_PENDING,
  FETCH_FULL_SCOPES_SUCCESS,
  GET_AUTH_TOKEN_SUCCESS,
  GET_CONSENTED_SCOPES_SUCCESS,
  QUERY_GRAPH_STATUS
} from '../../../app/services/redux-constants';
import { authenticationWrapper } from '../../../modules/authentication';
import { store } from '../../../store/index';
import { Mode } from '../../../types/enums';
import { ApplicationState } from '../../../types/root';
import { getPermissionsScopeType } from '../../utils/getPermissionsScopeType';
import { translateMessage } from '../../utils/translate-messages';
import { ACCOUNT_TYPE } from '../graph-constants';
import { fetchScopes } from '../slices/scopes.slice';
import { mockThunkMiddleware } from './mockThunkMiddleware';
import {
  consentToScopes,
  revokeScopes
} from './permissions-action-creator';
import { RevokePermissionsUtil } from './permissions-action-creator.util';

let mockStore = configureMockStore([mockThunkMiddleware]);

beforeEach(() => {
  const mockStore_ = configureMockStore([mockThunkMiddleware]);
  mockStore = mockStore_
})
window.open = jest.fn();

const mockState: ApplicationState = {
  devxApi: {
    baseUrl: 'https://graph.microsoft.com/v1.0/me',
    parameters: '$count=true'
  },
  profile: {
    user: {
      id: '123',
      displayName: 'test',
      emailAddress: 'johndoe@ms.com',
      profileImageUrl: 'https://graph.microsoft.com/v1.0/me/photo/$value',
      ageGroup: 0,
      tenant: 'binaryDomain',
      profileType: ACCOUNT_TYPE.MSA
    },
    status: 'success',
    error: undefined
  },
  sampleQuery: {
    sampleUrl: 'http://localhost:8080/api/v1/samples/1',
    selectedVerb: 'GET',
    selectedVersion: 'v1',
    sampleHeaders: []
  },
  auth: {
    authToken: { token: false, pending: false },
    consentedScopes: ['profile.read User.Read Files.Read']
  },
  isLoadingData: false,
  queryRunnerStatus: null,
  termsOfUse: true,
  theme: 'dark',
  graphExplorerMode: Mode.Complete,
  sidebarProperties: {
    showSidebar: true,
    mobileScreen: false
  },
  samples: {
    queries: [],
    status: 'idle',
    error: null
  },
  scopes: {
    pending: { isSpecificPermissions: false, isFullPermissions: false },
    data: {
      fullPermissions: [],
      specificPermissions: []
    },
    error: null
  },
  history: [],
  graphResponse: {
    body: undefined,
    headers: undefined
  },
  snippets: {
    pending: false,
    data: [],
    error: null
  },
  responseAreaExpanded: false,
  dimensions: {
    request: {
      width: '100',
      height: '100'
    },
    response: {
      width: '100',
      height: '100'
    },
    sidebar: {
      width: '100',
      height: '100'
    },
    content: {
      width: '100',
      height: '100'
    }
  },
  autoComplete: {
    data: null,
    error: null,
    status: 'idle'
  },
  resources: {
    pending: false,
    data: {},
    error: null
  }
}
const currentState = store.getState();
store.getState = () => {
  return {
    mockState,
    ...currentState
  }
}

describe('Permissions action creators', () => {

  it('should return a valid scope type when getPermissionsScopeType() is called with a user profile or null', () => {
    // Arrange
    const expectedResult = 'DelegatedWork';

    // Act
    const result = getPermissionsScopeType(null);

    // Assert
    expect(result).toEqual(expectedResult);

  });

  it('should fetch scopes', async () => {
    // Arrange
    const expectedResult = {}
    const expectedAction = [
      {
        type: FETCH_FULL_SCOPES_PENDING,
        payload: undefined
      },
      {
        type: FETCH_FULL_SCOPES_SUCCESS,
        payload: {
          scopes: {
            fullPermissions: {}
          }
        }
      }
    ];

    const store_ = mockStore(store.getState());

    const mockFetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(expectedResult)
      })
    });

    window.fetch = mockFetch;

    // Act and Assert
    await store_.dispatch(fetchScopes('full') as unknown as AnyAction);

    expect(store_.getActions().map(action => {
      const { meta, error, ...rest } = action;
      return rest;
    })).toEqual(expectedAction);

  });

  // TODO: fix this failing
  it.skip('should consent to scopes', () => {
    // Arrange
    jest.spyOn(authenticationWrapper, 'consentToScopes').mockResolvedValue({
      accessToken: 'jkkkkkkkkkkkkkkkkkkkksdss',
      authority: 'string',
      uniqueId: 'string',
      tenantId: 'string',
      scopes: ['profile.Read User.Read'],
      account: {
        homeAccountId: 'string',
        environment: 'string',
        tenantId: 'string',
        username: 'string',
        localAccountId: 'string'
      },
      idToken: 'string',
      idTokenClaims: {},
      fromCache: true,
      expiresOn: new Date(),
      tokenType: 'AAD',
      correlationId: 'string'
    })
    const expectedAction: any = [
      { type: GET_AUTH_TOKEN_SUCCESS, payload: undefined },
      {
        type: GET_CONSENTED_SCOPES_SUCCESS,
        payload: ['profile.Read User.Read']
      },
      {
        type: QUERY_GRAPH_STATUS,
        payload: {
          statusText: translateMessage('Success'),
          status: translateMessage('Scope consent successful'),
          ok: true,
          messageType: 4
        }
      },
      { type: 'GET_ALL_PRINCIPAL_GRANTS_PENDING', response: true }
    ];

    const store_ = mockStore(mockState);

    // Act and Assert
    // @ts-ignore
    return store_.dispatch(consentToScopes())
      // @ts-ignore
      .then(() => {
        expect(store_.getActions()).toEqual(expectedAction);
      });
  });

  describe('Revoke scopes', () => {
    it('should return Default Scope error when user tries to dissent to default scope', async () => {
      // Arrange
      const store_ = mockStore(mockState);
      jest.spyOn(RevokePermissionsUtil, 'getServicePrincipalId').mockResolvedValue('1234');
      jest.spyOn(RevokePermissionsUtil, 'getSignedInPrincipalGrant').mockReturnValue({
        clientId: '1234',
        consentType: 'Principal',
        principalId: '1234',
        resourceId: '1234',
        scope: 'profile.read User.Read',
        id: 'SomeNiceId'
      })
      jest.spyOn(RevokePermissionsUtil, 'getTenantPermissionGrants').mockResolvedValue({
        value: [
          {
            clientId: '1234',
            consentType: 'Principal',
            principalId: '1234',
            resourceId: '1234',
            scope: 'profile.read User.Read',
            id: 'SomeNiceId'
          },
          {
            clientId: '',
            consentType: 'AllPrincipal',
            principalId: null,
            resourceId: '1234',
            scope: 'profile.read User.Read Directory.Read.All'
          }
        ],
        '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#permissionGrants'
      })

      const revokePermissionsUtil = await RevokePermissionsUtil.initialize('kkk');

      jest.spyOn(revokePermissionsUtil, 'getUserPermissionChecks').mockResolvedValue({
        userIsTenantAdmin: false,
        permissionBeingRevokedIsAllPrincipal: true,
        grantsPayload: {
          value: [
            {
              clientId: '1234',
              consentType: 'Principal',
              principalId: '1234',
              resourceId: '1234',
              scope: 'profile.read User.Read',
              id: 'SomeNiceId'
            },
            {
              clientId: '',
              consentType: 'AllPrincipal',
              principalId: null,
              resourceId: '1234',
              scope: 'profile.read User.Read Directory.Read.All'
            }
          ],
          '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#permissionGrants'
        }
      })

      const expectedActions = [
        { type: 'REVOKE_SCOPES_PENDING', response: null },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Revoking'),
            status: translateMessage('Please wait while we revoke this permission'),
            ok: false,
            messageType: 0
          }
        },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Default scope'),
            status: translateMessage('Cannot delete default scope'),
            ok: false,
            messageType: 1
          }
        }
      ]


      // Act and Assert
      // @ts-ignore
      return store_.dispatch(revokeScopes('User.Read'))
        // @ts-ignore
        .then(() => {
          expect(store_.getActions()).toEqual(expectedActions);
        });
    });

    it('should return 401 when user does not have required permissions', async () => {
      // Arrange
      const store_ = mockStore(mockState);
      jest.spyOn(RevokePermissionsUtil, 'getServicePrincipalId').mockResolvedValue('1234');
      jest.spyOn(RevokePermissionsUtil, 'getSignedInPrincipalGrant').mockReturnValue({
        clientId: '1234',
        consentType: 'Principal',
        principalId: '1234',
        resourceId: '1234',
        scope: 'profile.read User.Read Access.Read',
        id: 'SomeNiceId'
      })
      jest.spyOn(RevokePermissionsUtil, 'getTenantPermissionGrants').mockResolvedValue({
        value: [
          {
            clientId: '1234',
            consentType: 'Principal',
            principalId: '1234',
            resourceId: '1234',
            scope: 'profile.read User.Read Access.Read',
            id: 'SomeNiceId'
          },
          {
            clientId: '',
            consentType: 'AllPrincipals',
            principalId: null,
            resourceId: '1234',
            scope: 'profile.read User.Read Directory.Reaqd.All Access.Read'
          }
        ],
        '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#permissionGrants'
      });

      const expectedActions = [
        { type: 'REVOKE_SCOPES_PENDING', response: null },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Revoking '),
            status: translateMessage('Please wait while we revoke this permission'),
            ok: false,
            messageType: 0
          }
        },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Unable to dissent'),
            status: translateMessage('Unable to dissent. You require the following permissions to revoke'),
            ok: false,
            messageType: 1
          }
        }
      ]

      // Act and Assert
      // @ts-ignore
      return store_.dispatch(revokeScopes('Access.Read'))
        // @ts-ignore
        .then(() => {
          expect(store_.getActions()).toEqual(expectedActions);
        });

    });

    //revisit
    it('should raise error when user attempts to dissent to an admin granted permission', async () => {
      // Arrange
      const store_ = mockStore(mockState);
      jest.spyOn(RevokePermissionsUtil, 'getServicePrincipalId').mockResolvedValue('1234');
      jest.spyOn(RevokePermissionsUtil, 'getSignedInPrincipalGrant').mockReturnValue({
        clientId: '1234',
        consentType: 'Principal',
        principalId: '1234',
        resourceId: '1234',
        scope: 'profile.read User.Read Access.Read Files.Read',
        id: 'SomeNiceId'
      })
      jest.spyOn(RevokePermissionsUtil, 'getTenantPermissionGrants').mockResolvedValue({
        value: [
          {
            clientId: '1234',
            consentType: 'Principal',
            principalId: '1234',
            resourceId: '1234',
            scope: 'User.Read Access.Read DelegatedPermissionGrant.ReadWrite.All Directory.Read.All Files.Read',
            id: 'SomeNiceId'
          },
          {
            clientId: '',
            consentType: 'AllPrincipals',
            principalId: null,
            resourceId: '1234',
            // eslint-disable-next-line max-len
            scope: 'profile.read User.Read Directory.Reaqd.All Access.Read DelegatedPermissionGrant.ReadWrite.All Directory.Read.All'
          }
        ],
        '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#permissionGrants'
      });

      jest.spyOn(RevokePermissionsUtil, 'isSignedInUserTenantAdmin').mockResolvedValue(false);

      const expectedActions = [
        { type: 'REVOKE_SCOPES_PENDING', response: null },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Revoking'),
            status: translateMessage('Please wait while we revoke this permission'),
            ok: false,
            messageType: 0
          }
        },
        { type: 'REVOKE_SCOPES_ERROR', response: null },
        {
          type: QUERY_GRAPH_STATUS,
          payload: {
            statusText: translateMessage('Revoking admin granted scopes'),
            // eslint-disable-next-line max-len
            status: translateMessage('You are unconsenting to an admin pre-consented permission'),
            ok: false,
            messageType: 1
          }
        }
      ]

      // Act and Assert
      // @ts-ignore
      await store_.dispatch(revokeScopes('Access.Read'));
      expect(store_.getActions()).toEqual(expectedActions);
    });
  })
})