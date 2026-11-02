// Third party dependencies.
import React from 'react';
import { shallow } from 'enzyme';
import { act, render, waitFor } from '@testing-library/react-native';

// Internal dependencies.
import AvatarFavicon from './AvatarFavicon';
import {
  AVATARFAVICON_IMAGE_TESTID,
  AVATARFAVICON_IMAGE_SVG_TESTID,
  SAMPLE_AVATARFAVICON_PROPS,
  SAMPLE_AVATARFAVICON_IMAGESOURCE_LOCAL,
  SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE,
  TEST_REMOTE_SVG_IMAGE_URL,
} from './AvatarFavicon.constants';
import { clearSvgContentTypeCache } from './AvatarFavicon.utils';

const SVG_HEAD_RESPONSE = {
  ok: true,
  headers: new Headers({ 'Content-Type': 'image/svg+xml' }),
  text: () => Promise.resolve('<svg />'),
};

// SvgUri fetches the SVG body itself, so only count the Content-Type checks.
const headRequests = () =>
  (global.fetch as jest.Mock).mock.calls.filter(
    ([, init]) => init?.method === 'HEAD',
  );

describe('AvatarFavicon', () => {
  beforeEach(() => {
    clearSvgContentTypeCache();
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
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'Content-Type': 'image/svg+xml' }),
      text: () => '<svg />',
    });

    const { getByTestId, toJSON } = render(
      <AvatarFavicon
        {...SAMPLE_AVATARFAVICON_PROPS}
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );

    await waitFor(() =>
      expect(getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeDefined(),
    );

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

  it('sends one HEAD request per SVG URI across mounts', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(SVG_HEAD_RESPONSE);

    const first = render(
      <AvatarFavicon
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );
    await waitFor(() =>
      expect(first.getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeDefined(),
    );
    first.unmount();

    const second = render(
      <AvatarFavicon
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );
    await waitFor(() =>
      expect(second.getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeDefined(),
    );

    expect(headRequests()).toEqual([
      [TEST_REMOTE_SVG_IMAGE_URL, { method: 'HEAD' }],
    ]);
  });

  it('does not re-send the HEAD request when re-rendered with a new { uri } object', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(SVG_HEAD_RESPONSE);

    const { getByTestId, rerender } = render(
      <AvatarFavicon imageSource={{ uri: TEST_REMOTE_SVG_IMAGE_URL }} />,
    );
    await waitFor(() =>
      expect(getByTestId(AVATARFAVICON_IMAGE_SVG_TESTID)).toBeDefined(),
    );

    rerender(
      <AvatarFavicon imageSource={{ uri: TEST_REMOTE_SVG_IMAGE_URL }} />,
    );
    rerender(
      <AvatarFavicon imageSource={{ uri: TEST_REMOTE_SVG_IMAGE_URL }} />,
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(headRequests()).toHaveLength(1);
  });

  it('does not update state when the HEAD response arrives after unmount', async () => {
    let resolveHead: (value: typeof SVG_HEAD_RESPONSE) => void = () =>
      undefined;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveHead = resolve;
      }),
    );
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const { unmount } = render(
      <AvatarFavicon
        imageSource={SAMPLE_AVATARFAVICON_SVGIMAGESOURCE_REMOTE}
      />,
    );
    unmount();
    await act(async () => {
      resolveHead(SVG_HEAD_RESPONSE);
      await Promise.resolve();
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not send a HEAD request for non-SVG favicons', () => {
    render(<AvatarFavicon {...SAMPLE_AVATARFAVICON_PROPS} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
