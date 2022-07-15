import { RESPONSE_EXPANDED } from '../../../app/services/redux-constants';
import { expandResponseArea } from '../../../app/services/actions/response-expanded-action-creator';

describe('Response Area Expansion', () => {
  it('should dispatch RESPONSE_EXPANDED when expandResponseArea() is called', () => {
    //Arrange
    const response: boolean = true;

    const expectedAction = {
      type: RESPONSE_EXPANDED,
      response
    }

    // Act
    const action = expandResponseArea(response);

    // Assert
    expect(action).toEqual(expectedAction);
  })
})