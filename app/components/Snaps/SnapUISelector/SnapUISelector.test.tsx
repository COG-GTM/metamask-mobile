import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SnapUISelector } from './SnapUISelector';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';

jest.mock('../SnapInterfaceContext');
jest.mock('../../Approvals/ApprovalModal', () => {
  const { View } = jest.requireActual('react-native');
  const MockApprovalModal = ({
    children,
    isVisible,
  }: {
    children: React.ReactNode;
    isVisible: boolean;
  }) => (isVisible ? <View testID="approval-modal">{children}</View> : null);
  return { __esModule: true, default: MockApprovalModal };
});

describe('SnapUISelector', () => {
  const handleInputChange = jest.fn();
  const getValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSnapInterfaceContext as jest.Mock).mockReturnValue({
      handleInputChange,
      getValue,
    });
    getValue.mockReturnValue(undefined);
  });

  const options = [
    { value: 'a', disabled: false },
    { value: 'b', disabled: false },
  ];
  const optionComponents = [
    <Text key="a">Option A</Text>,
    <Text key="b">Option B</Text>,
  ];

  it('renders the selector button', () => {
    const { getByTestId } = render(
      <SnapUISelector
        name="choice"
        title="Pick one"
        options={options}
        optionComponents={optionComponents}
      />,
    );
    expect(getByTestId('snap-ui-renderer__selector')).toBeTruthy();
  });

  it('opens the modal and selects an option', () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(
      <SnapUISelector
        name="choice"
        title="Pick one"
        options={options}
        optionComponents={optionComponents}
        form="myForm"
      />,
    );

    expect(queryByTestId('approval-modal')).toBeNull();

    fireEvent.press(getByTestId('snap-ui-renderer__selector'));
    expect(getByTestId('approval-modal')).toBeTruthy();

    const items = getAllByTestId('snap-ui-renderer__selector-item');
    fireEvent.press(items[1]);

    expect(handleInputChange).toHaveBeenCalledWith('choice', 'b', 'myForm');
  });

  it('shows the error help text when error is provided', () => {
    const { getByText } = render(
      <SnapUISelector
        name="choice"
        title="Pick"
        options={options}
        optionComponents={optionComponents}
        error="Required"
      />,
    );
    expect(getByText('Required')).toBeTruthy();
  });

  it('shows the label when provided', () => {
    const { getByText } = render(
      <SnapUISelector
        name="choice"
        title="Pick"
        label="Choice"
        options={options}
        optionComponents={optionComponents}
      />,
    );
    expect(getByText('Choice')).toBeTruthy();
  });

  it('uses the initial value from the snap interface context', () => {
    getValue.mockReturnValue('b');
    const { toJSON } = render(
      <SnapUISelector
        name="choice"
        title="Pick"
        options={options}
        optionComponents={optionComponents}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
