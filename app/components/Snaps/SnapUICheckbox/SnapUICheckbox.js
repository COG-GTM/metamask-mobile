import React, { useEffect, useState } from 'react';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';
import { BorderColor, FlexDirection } from '../../UI/Box/box.types';
import Checkbox from '../../../component-library/components/Checkbox/Checkbox';
import { HelpTextSeverity } from '../../../component-library/components/Form/HelpText/HelpText.types';
import HelpText from '../../../component-library/components/Form/HelpText';
import Label from '../../../component-library/components/Form/Label';
import { Box } from '../../UI/Box/Box';
import { TextVariant } from '../../../component-library/components/Texts/Text';














export const SnapUICheckbox = ({
  name,
  variant,
  fieldLabel,
  label,
  error,
  form,
  disabled,
  style,
  ...props
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form);

  const [value, setValue] = useState(initialValue ?? false);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = () => {
    setValue(!value);
    handleInputChange(name, !value, form);
  };

  return (
    <Box style={style} flexDirection={FlexDirection.Column}>
      {fieldLabel &&
      <Label variant={TextVariant.BodyMDMedium}>{fieldLabel}</Label>
      }
      <Checkbox
        {...props}
        onPress={handleChange}
        isChecked={value}
        label={label}
        checkboxStyle={{
          borderColor: BorderColor.borderMuted
        }}
        isDisabled={disabled} />
      
      {error &&
      // eslint-disable-next-line react-native/no-inline-styles
      <HelpText severity={HelpTextSeverity.Error} style={{ marginTop: 4 }}>
          {error}
        </HelpText>
      }
    </Box>);

};