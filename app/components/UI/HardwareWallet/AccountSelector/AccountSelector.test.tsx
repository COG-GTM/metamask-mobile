jest.mock('../../StyledButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return (props: any) => (
    <TouchableOpacity onPress={props.onPress}>
      <Text>{props.children}</Text>
    </TouchableOpacity>
  );
});

describe('AccountSelector', () => {
  it('module exports correctly', () => {
    const mod = require('./index');
    expect(mod).toBeDefined();
  });
});
