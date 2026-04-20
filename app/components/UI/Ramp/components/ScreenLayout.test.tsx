import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import ScreenLayout from './ScreenLayout';

describe('ScreenLayout', () => {
  it('renders children inside a non-scrolling container by default', () => {
    const { toJSON, getByText } = render(
      <ScreenLayout>
        <Text>layout-child</Text>
      </ScreenLayout>,
    );
    expect(getByText('layout-child')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a scrollable container when `scrollable` is true', () => {
    const { toJSON } = render(
      <ScreenLayout scrollable>
        <Text>scrollable-child</Text>
      </ScreenLayout>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('ScreenLayout.Header', () => {
  it('renders string title and description', () => {
    const { getByText } = render(
      <ScreenLayout.Header title="Title" description="Description" bold />,
    );
    expect(getByText('Title')).toBeDefined();
    expect(getByText('Description')).toBeDefined();
  });

  it('renders a function title', () => {
    const { getByText } = render(
      <ScreenLayout.Header title={() => <Text>Dynamic Title</Text>} />,
    );
    expect(getByText('Dynamic Title')).toBeDefined();
  });

  it('renders children without a title or description', () => {
    const { getByText } = render(
      <ScreenLayout.Header>
        <Text>custom header</Text>
      </ScreenLayout.Header>,
    );
    expect(getByText('custom header')).toBeDefined();
  });
});

describe('ScreenLayout.Body', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScreenLayout.Body>
        <Text>body-child</Text>
      </ScreenLayout.Body>,
    );
    expect(getByText('body-child')).toBeDefined();
  });
});

describe('ScreenLayout.Footer', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScreenLayout.Footer>
        <Text>footer-child</Text>
      </ScreenLayout.Footer>,
    );
    expect(getByText('footer-child')).toBeDefined();
  });
});

describe('ScreenLayout.Content', () => {
  it('renders children and respects the grow prop', () => {
    const { getByText, toJSON } = render(
      <ScreenLayout.Content grow>
        <Text>content-child</Text>
      </ScreenLayout.Content>,
    );
    expect(getByText('content-child')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });
});
