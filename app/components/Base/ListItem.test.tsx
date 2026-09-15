import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import ListItem from './ListItem';
import { ThemeContext, mockTheme } from '../../util/theme';

const customStyle = { fontSize: 20 };

const withTheme = (ui: React.ReactElement, theme = mockTheme) => (
  <ThemeContext.Provider value={theme}>{ui}</ThemeContext.Provider>
);

describe('ListItem', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all sub-components with expected styles', () => {
    const { getByTestId, toJSON } = render(
      withTheme(
        <ListItem testID="wrapper">
          <ListItem.Date testID="date">date</ListItem.Date>
          <ListItem.Content testID="content">
            <ListItem.Icon testID="icon" />
            <ListItem.Body testID="body">
              <ListItem.Title testID="title">title</ListItem.Title>
            </ListItem.Body>
            <ListItem.Amounts testID="amounts">
              <ListItem.Amount testID="amount">1 ETH</ListItem.Amount>
              <ListItem.FiatAmount testID="fiat">$1</ListItem.FiatAmount>
            </ListItem.Amounts>
          </ListItem.Content>
          <ListItem.Actions testID="actions" />
        </ListItem>,
      ),
    );

    expect(StyleSheet.flatten(getByTestId('wrapper').props.style)).toEqual(
      expect.objectContaining({ padding: 15 }),
    );
    expect(StyleSheet.flatten(getByTestId('date').props.style)).toEqual(
      expect.objectContaining({
        fontSize: 12,
        color: mockTheme.colors.text.default,
      }),
    );
    expect(StyleSheet.flatten(getByTestId('fiat').props.style)).toEqual(
      expect.objectContaining({
        color: mockTheme.colors.text.alternative,
        textTransform: 'uppercase',
      }),
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('merges custom style after base style', () => {
    const { getByTestId } = render(
      withTheme(
        <ListItem.Title testID="title" style={customStyle}>
          title
        </ListItem.Title>,
      ),
    );
    expect(StyleSheet.flatten(getByTestId('title').props.style)).toEqual(
      expect.objectContaining({ fontSize: 20 }),
    );
  });

  it('does not rebuild the stylesheet on re-render when colors are unchanged', () => {
    const createSpy = jest.spyOn(StyleSheet, 'create');
    const { rerender } = render(withTheme(<ListItem.Body testID="a" />));
    expect(createSpy).toHaveBeenCalledTimes(1);

    rerender(withTheme(<ListItem.Body testID="b" />));
    rerender(withTheme(<ListItem.Body testID="c" />, { ...mockTheme }));

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the stylesheet when the theme colors change', () => {
    const createSpy = jest.spyOn(StyleSheet, 'create');
    const { rerender, getByTestId } = render(
      withTheme(<ListItem.Title testID="title">title</ListItem.Title>),
    );
    const callsAfterMount = createSpy.mock.calls.length;

    rerender(
      withTheme(<ListItem.Title testID="title">title</ListItem.Title>, {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          text: { ...mockTheme.colors.text, default: '#123456' },
        },
      }),
    );

    expect(StyleSheet.flatten(getByTestId('title').props.style)).toEqual(
      expect.objectContaining({ color: '#123456' }),
    );
    expect(createSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });
});
