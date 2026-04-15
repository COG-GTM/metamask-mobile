








import { getJsxChildren } from '@metamask/snaps-utils';
import { getPrimaryChildElementIndex, mapToTemplate } from '../utils';
import { checkbox as checkboxFn } from './checkbox';
import { selector as selectorFn } from './selector';

import { constructInputProps } from './input';
import { assetSelector as assetSelectorFn } from './asset-selector';

export const field = ({
  element: e,
  form,
  ...params
}) => {
  // For fields we don't render the Input itself, we just adapt SnapUIInput.
  const children = getJsxChildren(e);
  const primaryChildIndex = getPrimaryChildElementIndex(
    children
  );
  const child = children[primaryChildIndex];

  // Fields have special styling that let's developers place two of them next to each other taking up 50% space.
  const style = {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '50%'
  };

  switch (child?.type) {
    case 'AddressInput':{
        const addressInput = child;
        return {
          element: 'SnapUIAddressInput',
          props: {
            name: addressInput.props.name,
            form,
            chainId: addressInput.props.chainId,
            displayAvatar: addressInput.props.displayAvatar,
            disabled: addressInput.props.disabled,
            placeholder: addressInput.props.placeholder,
            label: e.props.label,
            error: e.props.error,
            style
          }
        };
      }

    case 'Input':{
        const getLeftAccessory = () =>
        mapToTemplate({
          ...params,
          element: children[0]
        });

        const getRightAccessory = (accessoryIndex) =>
        mapToTemplate({
          ...params,
          element: children[accessoryIndex]
        });

        const input = child;

        const leftAccessoryMapped =
        primaryChildIndex > 0 ? getLeftAccessory() : undefined;

        let rightAccessoryIndex;
        if (children[2]) {
          rightAccessoryIndex = 2;
        } else if (primaryChildIndex === 0 && children[1]) {
          rightAccessoryIndex = 1;
        }
        const rightAccessoryMapped = rightAccessoryIndex ?
        getRightAccessory(rightAccessoryIndex) :
        undefined;

        return {
          element: 'SnapUIInput',
          props: {
            ...constructInputProps(input.props),
            id: input.props.name,
            placeholder: input.props.placeholder,
            label: e.props.label,
            name: input.props.name,
            form,
            error: e.props.error,
            disabled: child.props.disabled,
            style
          },
          propComponents: {
            startAccessory: leftAccessoryMapped && {
              ...leftAccessoryMapped,
              props: {
                ...leftAccessoryMapped.props,
                style: {
                  padding: 0,
                  height: '100%',
                  justifyContent: 'center'
                }
              }
            },
            endAccessory: rightAccessoryMapped && {
              ...rightAccessoryMapped,
              props: {
                ...rightAccessoryMapped.props,
                style: {
                  padding: 0,
                  height: '100%',
                  justifyContent: 'center'
                }
              }
            }
          }
        };
      }

    case 'Checkbox':{
        const checkbox = child;
        const checkboxMapped = checkboxFn({
          element: checkbox
        });
        return {
          element: 'SnapUICheckbox',
          props: {
            ...checkboxMapped.props,
            fieldLabel: e.props.label,
            form,
            error: e.props.error,
            disabled: child.props.disabled,
            style
          }
        };
      }

    case 'Selector':{
        const selector = child;
        const selectorMapped = selectorFn({
          ...params,
          element: selector
        });
        return {
          ...selectorMapped,
          element: 'SnapUISelector',
          props: {
            ...selectorMapped.props,
            label: e.props.label,
            form,
            error: e.props.error,
            disabled: child.props.disabled,
            style
          }
        };
      }

    case 'AssetSelector':{
        const assetSelector = child;
        const assetSelectorMapped = assetSelectorFn({
          ...params,
          element: assetSelector
        });


        return {
          ...assetSelectorMapped,
          element: 'SnapUIAssetSelector',
          props: {
            ...assetSelectorMapped.props,
            label: e.props.label,
            form,
            error: e.props.error,
            compact: params.isParentFlexRow,
            style
          }
        };
      }

    default:
      throw new Error(`Invalid Field child: ${child.type}`);
  }
};