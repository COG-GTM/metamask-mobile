// Third party dependencies.
import React from 'react';

// External dependencies.
import { IconName } from '../../../../Icons/Icon';

// Internal dependencies.
import AccordionHeader from './AccordionHeader';
import { render } from '@testing-library/react-native';
import {
  TESTID_ACCORDIONHEADER,
  TESTID_ACCORDIONHEADER_TITLE,
  TESTID_ACCORDIONHEADER_ARROWICON,
  SAMPLE_ACCORDIONHEADER_TITLE,
} from './AccordionHeader.constants';

describe('AccordionHeader - Snapshot', () => {
  it('should render default settings correctly', () => {
    const { toJSON } = render(
      <AccordionHeader title={SAMPLE_ACCORDIONHEADER_TITLE} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
  it('should render a rotated down Arrow if isExpanded is true', () => {
    const { toJSON } = render(
      <AccordionHeader title={SAMPLE_ACCORDIONHEADER_TITLE} isExpanded />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('AccordionHeader', () => {
  it('should render AccordionHeader', () => {
    const { toJSON } = render(
      <AccordionHeader title={SAMPLE_ACCORDIONHEADER_TITLE} />,
    );
    const accordionHeaderComponent = wrapper.findWhere(
      (node) => node.prop('testID') === TESTID_ACCORDIONHEADER,
    );
    expect(accordionHeaderComponent.exists()).toBe(true);
  });
  it('should render the given title', () => {
    const { toJSON } = render(
      <AccordionHeader title={SAMPLE_ACCORDIONHEADER_TITLE} />,
    );
    const titleElement = wrapper.findWhere(
      (node) => node.prop('testID') === TESTID_ACCORDIONHEADER_TITLE,
    );
    expect(titleElement.props().children).toBe(SAMPLE_ACCORDIONHEADER_TITLE);
  });
  it('should render the proper arrow down icon', () => {
    const { toJSON } = render(
      <AccordionHeader title={SAMPLE_ACCORDIONHEADER_TITLE} />,
    );
    const iconElement = wrapper.findWhere(
      (node) => node.prop('testID') === TESTID_ACCORDIONHEADER_ARROWICON,
    );
    expect(iconElement.props().name).toBe(IconName.ArrowDown);
  });
  //TODO: Add Test for Pressed state and animation
});
