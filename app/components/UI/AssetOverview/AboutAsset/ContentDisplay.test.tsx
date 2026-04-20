import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ContentDisplay from './ContentDisplay';

describe('ContentDisplay', () => {
  const longContent = 'This is a long description about the asset.';

  it('renders the content collapsed by default and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <ContentDisplay content={longContent} disclaimer="disclaimer text" />,
    );

    expect(getByText(longContent)).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('toggles expansion when the show more / show less button is pressed', () => {
    const { getByText, queryByText } = render(
      <ContentDisplay
        content={longContent}
        disclaimer="Some important disclaimer"
      />,
    );

    expect(queryByText('Some important disclaimer')).toBeNull();

    fireEvent.press(getByText(/show more/i));

    expect(getByText('Some important disclaimer')).toBeDefined();

    fireEvent.press(getByText(/show less/i));

    expect(queryByText('Some important disclaimer')).toBeNull();
  });

  it('does not render a disclaimer when none is provided', () => {
    const { queryByText, getByText } = render(
      <ContentDisplay content={longContent} />,
    );

    fireEvent.press(getByText(/show more/i));

    expect(queryByText(/disclaimer/i)).toBeNull();
  });
});
