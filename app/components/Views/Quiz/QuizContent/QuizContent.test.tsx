import React from 'react';
import { render } from '@testing-library/react-native';
import QuizContent from './QuizContent';

jest.mock('react-native-gesture-handler', () => {
  const { TouchableOpacity } = jest.requireActual('react-native');
  return { TouchableOpacity };
});

jest.mock('../../../hooks/useStyles', () => ({
  useStyles: () => ({
    styles: {
      container: {},
      header: {},
      spacer: {},
      headerText: {},
      icon: {},
      image: {},
      title: {},
      content: {},
      buttonsContainer: {},
    },
    theme: {
      colors: {
        icon: { default: '#000' },
        primary: { default: '#037DD6' },
      },
    },
  }),
}));

describe('QuizContent', () => {
  const defaultProps = {
    header: 'Quiz Header',
    title: 'Quiz Title',
    content: 'Quiz content text',
    buttons: [],
    dismiss: jest.fn(),
  };

  it('renders correctly', () => {
    const { toJSON } = render(<QuizContent {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders header text', () => {
    const { getByText } = render(<QuizContent {...defaultProps} />);
    expect(getByText('Quiz Header')).toBeDefined();
  });

  it('renders title text', () => {
    const { getByText } = render(<QuizContent {...defaultProps} />);
    expect(getByText('Quiz Title')).toBeDefined();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<QuizContent {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
