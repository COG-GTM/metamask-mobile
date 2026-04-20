import PAGINATION_OPERATIONS from './pagination';

describe('pagination constants', () => {
  it('defines GET_FIRST_PAGE as 0', () => {
    expect(PAGINATION_OPERATIONS.GET_FIRST_PAGE).toBe(0);
  });

  it('defines GET_NEXT_PAGE as 1', () => {
    expect(PAGINATION_OPERATIONS.GET_NEXT_PAGE).toBe(1);
  });

  it('defines GET_PREVIOUS_PAGE as -1', () => {
    expect(PAGINATION_OPERATIONS.GET_PREVIOUS_PAGE).toBe(-1);
  });
});
