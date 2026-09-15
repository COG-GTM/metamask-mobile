import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import SimpleWebview from './';

type SimpleWebviewProps = React.ComponentProps<typeof SimpleWebview>;
const SimpleWebviewScreen = SimpleWebview as unknown as ComponentType<{
  navigation: Pick<
    SimpleWebviewProps['navigation'],
    'setParams' | 'setOptions'
  >;
  route: SimpleWebviewProps['route'];
}>;

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <SimpleWebviewScreen
        navigation={{
          setParams: () => {
            ('');
          },
          setOptions: () => null,
        }}
        route={
          {
            params: { url: 'https://etherscan.io', title: 'etherscan' },
          } as SimpleWebviewProps['route']
        }
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
