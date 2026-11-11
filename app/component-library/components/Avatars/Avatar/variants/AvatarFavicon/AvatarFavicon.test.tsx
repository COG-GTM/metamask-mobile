// Third party dependencies.
import React from 'react';
import { shallow } from 'enzyme';
import { render, waitFor } from '@testing-library/react-native';

// Internal dependencies.
import AvatarFavicon from './AvatarFavicon';
import {
  AVATARFAVICON_IMAGE_TESTID,
  AVATARFAVICON_IMAGE_SVG_TESTID,
  SAMPLE_AVATARFAVICON_PROPS,
  SAMPLE_AVATARFAVICON_IMAGESOURCE_LOCAL,
  SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE,
  DEFAULT_AVATARFAVICON_ERROR_ICON,
} from './AvatarFavicon.constants';

describe('AvatarFavicon', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should match the snapshot', () => {
    const wrapper = shallow(<AvatarFavicon {...SAMPLE_AVATARFAVICON_PROPS} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render favicon with remote image', () => {
    const wrapper = shallow(<AvatarFavicon {...SAMPLE_AVATARFAVICON_PROPS} />);
    const imageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    expect(imageComponent.exists()).toBe(true);
  });

  it('should render favicon with local image', () => {
    const wrapper = shallow(
      <AvatarFavicon
        {...SAMPLE_AVATARFAVICON_PROPS}
        imageSource={SAMPLE_AVATARFAVICON_IMAGESOURCE_LOCAL}
      />,
    );
    const imageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    expect(imageComponent.exists()).toBe(true);
  });

  it('should render SVG', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, headers: new Headers({'Content-Type': 'image/svg+xml'}), text: () => '<svg />' });

    const { getByTestId, toJSON } = render(
      <AvatarFavicon
        {...SAMPLE_AVATARFAVICON_PROPS}
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );

    await waitFor(() => expect(getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeDefined());

    expect(toJSON()).toMatchSnapshot();
  });

  it('should render fallback', () => {
    const wrapper = shallow(<AvatarFavicon {...SAMPLE_AVATARFAVICON_PROPS} />);
    const prevImageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    // Simulate onError on Image component
    prevImageComponent.props().onError({ nativeEvent: { error: 'ERROR!' } });
    const currentImageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    expect(currentImageComponent.exists()).toBe(false);
  });

  it('should render fallback when svg has error', () => {
    const wrapper = shallow(
      <AvatarFavicon
        {...SAMPLE_AVATARFAVICON_PROPS}
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );
    const prevImageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    // Simulate onError on Image component
    prevImageComponent.props().onError(new Error('ERROR!'));
    const currentImageComponent = wrapper.findWhere(
      (node) => node.prop('testID') === AVATARFAVICON_IMAGE_TESTID,
    );
    expect(currentImageComponent.exists()).toBe(true);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders SvgXml for a valid utf8 SVG data URI', async () => {
    const xml = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const { getByTestId } = render(
      <AvatarFavicon
        {...SAMPLE_AVATARFAVICON_PROPS}
        imageSource={{
          uri: `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`,
        }}
      />,
    );

    await waitFor(() =>
      expect(getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID).props.xml).toBe(xml),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    'data:image/svg+xml;utf8,%',
    'data:image/svg+xml;utf8,<svg>%zz</svg>',
    'data:image/svg+xml;utf8,%E0%A4%A',
  ])(
    'renders the fallback icon instead of throwing for malformed data URI %s',
    async (uri) => {
      const { UNSAFE_getByProps, queryByTestId } = render(
        <AvatarFavicon {...SAMPLE_AVATARFAVICON_PROPS} imageSource={{ uri }} />,
      );

      await waitFor(() =>
        expect(queryByTestId(AVATARFAVICON_IMAGE_TESTID)).toBeNull(),
      );
      expect(queryByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeNull();
      expect(
        UNSAFE_getByProps({ name: DEFAULT_AVATARFAVICON_ERROR_ICON }),
      ).toBeDefined();
    },
  );
});
