
import { AnyAction } from '@reduxjs/toolkit';
import configureMockStore from 'redux-mock-store';

import { store } from '../../../../src/store/index';
import { fetchAutoCompleteOptions } from '../../../app/services/actions/autocomplete-action-creators';
import { suggestions } from '../../../modules/suggestions/suggestions';
import { Mode } from '../../../types/enums';
import { ApplicationState } from '../../../types/root';
import { mockThunkMiddleware } from './mockThunkMiddleware';


const mockStore = configureMockStore([mockThunkMiddleware]);

jest.mock('../../../../src/store/index');
window.fetch = jest.fn();

const mockState: ApplicationState = {
  devxApi: {
    baseUrl: 'https://graph.microsoft.com/v1.0/me',
    parameters: '$count=true'
  },
  profile: null,
  sampleQuery: {
    sampleUrl: 'http://localhost:8080/api/v1/samples/1',
    selectedVerb: 'GET',
    selectedVersion: 'v1',
    sampleHeaders: []
  },
  auth: {
    authToken: { token: false, pending: false },
    consentedScopes: []
  },
  isLoadingData: false,
  queryRunnerStatus: null,
  termsOfUse: true,
  theme: 'dark',
  adaptiveCard: {
    pending: false,
    data: {
      template: 'Template'
    }
  },
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
      width: '100px',
      height: '100px'
    },
    response: {
      width: '100px',
      height: '100px'
    },
    sidebar: {
      width: '100px',
      height: '100px'
    },
    content: {
      width: '100px',
      height: '100px'
    }
  },
  autoComplete: {
    data: null,
    error: null,
    pending: false
  },
  resources: {
    pending: false,
    data: {},
    error: null
  }
}

store.getState = () => ({
  ...mockState,
  proxyUrl: '',
  collections: [],
  graphExplorerMode: Mode.Complete,
  queryRunnerStatus: null,
  samples: {
    queries: [],
    status: 'idle',
    error: null
  }
})

describe('fetchAutoCompleteOptions', () => {
  it('dispatches fetchAutocompleteSuccess when suggestions are retrieved successfully', async () => {
    const url = '/some/url';
    const version = '1.0';

    // Replace this with a sample response object you expect from suggestions.getSuggestions
    const sampleSuggestions = ['option1', 'option2', 'option3'];
    suggestions.getSuggestions = jest.fn().mockResolvedValue(sampleSuggestions);

    // Create a mock store
    const store_ = mockStore(store.getState());

    // Call the function by dispatching the returned async function
    await store_.dispatch(fetchAutoCompleteOptions(url, version) as unknown as AnyAction);

    // Assertions
    const expectedActions = [
      { type: 'AUTOCOMPLETE_FETCH_PENDING', response: null },
      {
        type: 'AUTOCOMPLETE_FETCH_SUCCESS',
        response: [ 'option1', 'option2', 'option3' ]
      }
    ];
    expect(store_.getActions()).toEqual(expectedActions);
  });

  it('dispatches fetchAutocompleteError when suggestions retrieval fails', async () => {
    const url = '/some/url';
    const version = '1.0';

    // Mock a response with null
    suggestions.getSuggestions = jest.fn().mockResolvedValue(null);

    // Create a mock store
    const store_ = mockStore(store.getState());

    // Call the function by dispatching the returned async function
    await store_.dispatch(fetchAutoCompleteOptions(url, version) as unknown as AnyAction);

    // Assertions
    const expectedActions = [
      { type: 'AUTOCOMPLETE_FETCH_PENDING', response: null },
      { type: 'AUTOCOMPLETE_FETCH_ERROR', response: {} }
    ];
    expect(store_.getActions()).toEqual(expectedActions);
  });
});
