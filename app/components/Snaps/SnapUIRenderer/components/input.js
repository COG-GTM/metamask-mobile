
import { hasProperty } from '@metamask/utils';



// For now the types only change what the input looks like.
// There is no special behavior for min, max, step etc.
export const constructInputProps = (props) => {
  if (!hasProperty(props, 'type')) {
    return {};
  }

  switch (props.type) {
    case 'password':{
        return {
          secureTextEntry: true
        };
      }

    case 'number':{
        return {
          keyboardType: 'numeric'
        };
      }

    default:
      return {};
  }
};

export const input = ({
  element: e,
  form
}) => ({
  element: 'SnapUIInput',
  props: {
    ...constructInputProps(e.props),
    id: e.props.name,
    placeholder: e.props.placeholder,
    disabled: e.props.disabled,
    name: e.props.name,
    form
  }
});