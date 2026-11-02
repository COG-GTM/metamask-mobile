import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert, AlertButton, Linking, Text, View } from 'react-native';
import { SnapUILink } from './SnapUILink';
import {
  SnapInterfaceContext,
  SnapInterfaceContextType,
} from '../SnapInterfaceContext';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';

const PREINSTALLED_SNAP_ID = 'npm:@metamask/preinstalled-example-snap';

jest.mock('../../../lib/snaps/preinstalled-snaps', () => ({
  __esModule: true,
  default: [{ snapId: 'npm:@metamask/preinstalled-example-snap' }],
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

const renderWithSnap = (snapId: string, ui: React.ReactElement) =>
  render(
    <SnapInterfaceContext.Provider
      value={{ snapId } as unknown as SnapInterfaceContextType}
    >
      {ui}
    </SnapInterfaceContext.Provider>,
  );

const pressContinue = () => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButton[];
  buttons.find((button) => button.style !== 'cancel')?.onPress?.();
};

describe('SnapUILink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  const validProps = {
    href: 'https://example.com',
    children: 'Visit MetaMask',
  };

  it('renders correctly with valid props', () => {
    const { UNSAFE_getByType, getByTestId } = render(
      <SnapUILink {...validProps} />,
    );

    const linkText = getByTestId('snaps-ui-link');
    const spacer = UNSAFE_getByType(View);
    const icon = UNSAFE_getByType(Icon);

    expect(linkText).toBeTruthy();
    expect(linkText.props.children[0]).toBe('Visit MetaMask');
    expect(spacer).toBeTruthy();
    expect(spacer.props.style).toEqual({ width: 4 });
    expect(linkText.props.accessibilityRole).toBe('link');
    expect(icon.props.name).toBe(IconName.Export);
    expect(icon.props.color).toBe(IconColor.Primary);
    expect(icon.props.size).toBe(IconSize.Sm);
  });

  it('asks for confirmation before opening a link from a non-preinstalled Snap', () => {
    const { getByTestId } = renderWithSnap(
      'npm:third-party-snap',
      <SnapUILink {...validProps} />,
    );

    fireEvent.press(getByTestId('snaps-ui-link'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(
      'You are leaving MetaMask',
    );
    expect((Alert.alert as jest.Mock).mock.calls[0][1]).toContain(
      validProps.href,
    );
    expect(Linking.openURL).not.toHaveBeenCalled();

    pressContinue();

    expect(Linking.openURL).toHaveBeenCalledWith(validProps.href);
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it('does not open the link when the confirmation is cancelled', () => {
    const { getByTestId } = renderWithSnap(
      'npm:third-party-snap',
      <SnapUILink {...validProps} />,
    );

    fireEvent.press(getByTestId('snaps-ui-link'));

    const buttons = (Alert.alert as jest.Mock).mock
      .calls[0][2] as AlertButton[];
    buttons.find((button) => button.style === 'cancel')?.onPress?.();

    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('asks for confirmation when rendered outside a Snap interface', () => {
    const { getByTestId } = render(<SnapUILink {...validProps} />);

    fireEvent.press(getByTestId('snaps-ui-link'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('opens links from preinstalled Snaps without confirmation', () => {
    const { getByTestId } = renderWithSnap(
      PREINSTALLED_SNAP_ID,
      <SnapUILink {...validProps} />,
    );

    fireEvent.press(getByTestId('snaps-ui-link'));

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalledWith(validProps.href);
  });

  it.each([
    'https://metamask.app.link/dapp/evil.example',
    'https://METAMASK.APP.LINK/send/0x0000000000000000000000000000000000000000',
    'https://metamask.app.link./dapp/evil.example',
    'https://user@metamask.app.link/dapp/evil.example',
    'https://foo.metamask.app.link/dapp/evil.example',
    'https://metamask-alternate.app.link/dapp/evil.example',
    'https://metamask.test-app.link/dapp/evil.example',
    'https://metamask-alternate.test-app.link/dapp/evil.example',
    'https://metamask.io/dapp/evil.example',
    'https://MetaMask.io./send/0x0000000000000000000000000000000000000000',
  ])('rejects MetaMask universal link %s', (href) => {
    const { getByTestId } = renderWithSnap(
      PREINSTALLED_SNAP_ID,
      <SnapUILink href={href}>Link</SnapUILink>,
    );

    expect(() => fireEvent.press(getByTestId('snaps-ui-link'))).toThrow(
      'Invalid URL',
    );
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it.each([
    'https://notmetamask.app.link.example.com/page',
    'https://support.metamask.io/page',
  ])('allows hosts that are not MetaMask universal link hosts: %s', (href) => {
    const { getByTestId } = renderWithSnap(
      'npm:third-party-snap',
      <SnapUILink href={href}>Link</SnapUILink>,
    );

    fireEvent.press(getByTestId('snaps-ui-link'));
    pressContinue();

    expect(Linking.openURL).toHaveBeenCalledWith(href);
  });

  it('throws error when URL does not start with https://', () => {
    const invalidProps = {
      href: 'http://example.com',
      children: 'Invalid Link',
    };

    const { getByTestId } = render(<SnapUILink {...invalidProps} />);

    const link = getByTestId('snaps-ui-link');

    expect(() => {
      fireEvent.press(link);
    }).toThrow('Invalid URL');

    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('can be nested inside another Text component', () => {
    const { toJSON } = render(
      <Text>
        Before <SnapUILink href="https://metamask.io">MetaMask</SnapUILink>{' '}
        After
      </Text>,
    );

    const textContent = JSON.stringify(toJSON());
    expect(textContent).toContain('Before');
    expect(textContent).toContain('MetaMask');
    expect(textContent).toContain('After');
  });

  it('handles array children correctly', () => {
    const { getByTestId } = render(
      <SnapUILink href="https://metamask.io">
        {'Part 1 '}
        {'Part 2'}
      </SnapUILink>,
    );

    const link = getByTestId('snaps-ui-link');
    const childrenArray = link.props.children;
    const textContent = childrenArray[0].toString();

    expect(textContent).toBe('Part 1 ,Part 2');
  });

  it('renders correctly with complex children', () => {
    const { UNSAFE_getAllByType, toJSON } = render(
      <SnapUILink href="https://metamask.io">
        Normal text
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <Text style={{ fontWeight: 'bold' }}>Bold text</Text>
      </SnapUILink>,
    );

    const textContent = JSON.stringify(toJSON());
    expect(textContent).toContain('Normal text');
    expect(textContent).toContain('Bold text');

    // Should have our Icon plus any Text components
    const allIcons = UNSAFE_getAllByType(Icon);
    expect(allIcons.length).toBe(1);
  });

  it('validates URL format correctly', () => {
    // Valid HTTPS URL
    expect(() => {
      fireEvent.press(
        render(
          <SnapUILink href="https://example.com">Link</SnapUILink>,
        ).getByTestId('snaps-ui-link'),
      );
    }).not.toThrow();

    // Invalid HTTP URL
    expect(() => {
      fireEvent.press(
        render(
          <SnapUILink href="http://example.com">Link</SnapUILink>,
        ).getByTestId('snaps-ui-link'),
      );
    }).toThrow('Invalid URL');

    // Invalid non-HTTP URL
    expect(() => {
      fireEvent.press(
        render(
          <SnapUILink href="ftp://example.com">Link</SnapUILink>,
        ).getByTestId('snaps-ui-link'),
      );
    }).toThrow('Invalid URL');
  });
});
