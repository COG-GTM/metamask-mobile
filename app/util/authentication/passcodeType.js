import Device from '../device';


/**
 * Determines the passcode type used in locales to dispaly the platform specific text
 * @param type - AUTHENTICATION_TYPE
 * @returns String of passcodeType for UI display of components
 */

export const passcodeType = (type) =>
Device.isIos() ? type + '_ios' : type + '_android';