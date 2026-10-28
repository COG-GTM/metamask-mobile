import React from 'react';
import { shallow } from 'enzyme';
import { Linking } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import SimpleWebview from './';

// Built at runtime so eslint's no-script-url rule doesn't flag test data.
const SCRIPT_URL = ['javascript', 'alert(1)'].join(':');

const renderSimpleWebview = (params: Record<string, unknown>) => {
  const setOptions = jest.fn();
  const wrapper = shallow(
    <SimpleWebview
      navigation={{
        setParams: () => {
          ('');
        },
        setOptions,
      }}
      route={{ params }}
    />,
  );
  return { wrapper, setOptions };
};

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const { wrapper } = renderSimpleWebview({
      url: 'https://etherscan.io',
      title: 'etherscan',
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('does not hand non-web navigations to the OS', () => {
    const openURL = jest.spyOn(Linking, 'openURL');
    const { wrapper } = renderSimpleWebview({ url: 'https://etherscan.io' });
    const webview = wrapper.find(WebView);

    expect(webview.prop('originWhitelist')).toEqual(['*']);
    const onShouldStart = webview.prop('onShouldStartLoadWithRequest') as (e: {
      url: string;
    }) => boolean;
    expect(onShouldStart({ url: 'customscheme://x' })).toBe(false);
    expect(onShouldStart({ url: 'tel:+15555555555' })).toBe(false);
    expect(onShouldStart({ url: SCRIPT_URL })).toBe(false);
    expect(onShouldStart({ url: 'https://etherscan.io/tx/0x1' })).toBe(true);
    expect(openURL).not.toHaveBeenCalled();
  });

  it.each([SCRIPT_URL, 'customscheme://x', undefined])(
    'does not render a WebView for %p',
    (url) => {
      const { wrapper } = renderSimpleWebview({ url });
      expect(wrapper.find(WebView)).toHaveLength(0);
    },
  );

  it('shows the hostname in the navbar when no title is given', () => {
    const { setOptions } = renderSimpleWebview({
      url: 'https://opensea.io/assets/1',
    });
    const options = setOptions.mock.calls[0][0];
    const title = shallow(options.headerTitle());
    expect(title.children().text()).toBe('opensea.io');
  });
});
