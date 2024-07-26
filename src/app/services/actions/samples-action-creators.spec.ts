import configureMockStore from 'redux-mock-store';
import { AppAction } from '../../../types/action';
import {
  SAMPLES_FETCH_SUCCESS
} from '../redux-constants';
import { fetchSamples } from '../slices/samples.slice';

const mockStore = configureMockStore([]);

describe('Samples action creators', () => {

  it('should dispatch SAMPLES_FETCH_SUCCESS when fetchSamples() is called', () => {

    const payload = fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
    const expectedAction: AppAction = {
      type: SAMPLES_FETCH_SUCCESS,
      payload
    };

    // Act
    const store = mockStore({});

    // @ts-ignore
    store.dispatch(fetchSamples());

    // Assert
    expect(store.getActions()).toEqual([expectedAction]);

  });
});
