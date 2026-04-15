/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */






export const MODAL_CONFIRMATION_NORMAL_BUTTON_ID =
'modal-confirmation-normal-button';

export const MODAL_CONFIRMATION_DANGER_BUTTON_ID =
'modal-confirmation-danger-button';

// Sample consts
const SAMPLE_MODALCONFIRMATION_ROUTE_PROPS = {
  params: {
    title: 'Sample ModalConfirmation Title',
    description: 'Sample ModalConfirmation description',
    onConfirm: () => {
      console.log('Modal Confirmation clicked');
    },
    onCancel: () => {
      console.log('Modal Confirmation cancelled');
    },
    cancelLabel: 'ModalConfirmation Cancel',
    confirmLabel: 'ModalConfirmation Label',
    isDanger: false
  }
};

export const SAMPLE_MODALCONFIRMATION_PROPS = {
  route: SAMPLE_MODALCONFIRMATION_ROUTE_PROPS
};