import { renderHook } from '@testing-library/react-hooks';
import useTooltipModal from './useTooltipModal';
import Routes from '../../constants/navigation/Routes';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('useTooltipModal', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('navigates to the tooltip modal with the provided title and tooltip', () => {
    const { result } = renderHook(() => useTooltipModal());
    result.current.openTooltipModal('Title', 'Body');
    expect(mockNavigate).toHaveBeenCalledWith(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.TOOLTIP_MODAL,
      params: { title: 'Title', tooltip: 'Body' },
    });
  });
});
