import React, { ComponentType, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { shallow } from 'enzyme';
import BaseKeypad from './components';

interface KeypadContainerProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface KeypadButtonProps {
  onPress: () => void;
  children?: ReactNode;
}

// `./components` is still JavaScript, so the statics attached to its default
// export are not visible to the compiler.
const Keypad = BaseKeypad as unknown as ComponentType<KeypadContainerProps> & {
  Row: ComponentType<{ children?: ReactNode }>;
  Button: ComponentType<KeypadButtonProps>;
  DeleteButton: ComponentType<{ onPress: () => void }>;
};

describe('Keypad component', () => {
  test('components should render correctly', () => {
    const dummyHandler = jest.fn();
    const wrapper = shallow(
      <Keypad>
        <Keypad.Row>
          <Keypad.Button onPress={dummyHandler}>1</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>2</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>3</Keypad.Button>
        </Keypad.Row>
        <Keypad.Row>
          <Keypad.Button onPress={dummyHandler}>4</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>5</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>6</Keypad.Button>
        </Keypad.Row>
        <Keypad.Row>
          <Keypad.Button onPress={dummyHandler}>7</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>8</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>9</Keypad.Button>
        </Keypad.Row>
        <Keypad.Row>
          <Keypad.Button onPress={dummyHandler}>.</Keypad.Button>
          <Keypad.Button onPress={dummyHandler}>0</Keypad.Button>
          <Keypad.DeleteButton onPress={dummyHandler} />
        </Keypad.Row>
      </Keypad>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
