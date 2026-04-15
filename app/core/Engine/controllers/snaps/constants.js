























// SnapController Events
export const SnapControllerStateChangeEvent =
'SnapController:stateChange';

export const SnapControllerSnapInstalledEvent =
'SnapController:snapInstalled';

export const SnapControllerSnapUpdatedEvent =
'SnapController:snapUpdated';

export const SnapControllerSnapUninstalledEvent =
'SnapController:snapUninstalled';

export const SnapControllerSnapEnabledEvent =
'SnapController:snapEnabled';

export const SnapControllerSnapDisabledEvent =
'SnapController:snapDisabled';

// SnapController Actions
export const SnapControllerHandleRequestAction =
'SnapController:handleRequest';

export const SnapControllerClearSnapStateAction =
'SnapController:clearSnapState';

export const SnapControllerGetSnapAction =
'SnapController:get';

export const SnapControllerGetSnapStateAction =
'SnapController:getSnapState';

export const SnapControllerUpdateSnapStateAction =
'SnapController:updateSnapState';

export const SnapControllerGetPermittedSnapsAction =
'SnapController:getPermitted';

export const SnapControllerInstallSnapsAction =
'SnapController:install';

export const SnapControllerGetSnapFileAction =
'SnapController:getFile';

export const SnapControllerGetAllSnapsAction =
'SnapController:getAll';

// SnapInterfaceController Actions
export const SnapInterfaceControllerCreateInterfaceAction =
'SnapInterfaceController:createInterface';

export const SnapInterfaceControllerUpdateInterfaceAction =
'SnapInterfaceController:updateInterface';

export const SnapInterfaceControllerResolveInterfaceAction =
'SnapInterfaceController:resolveInterface';

export const SnapInterfaceControllerUpdateInterfaceStateAction =
'SnapInterfaceController:updateInterfaceState';

// CronjobController Actions
export const CronjobControllerCancelBackgroundEventAction =
'CronjobController:cancelBackgroundEvent';

export const CronjobControllerGetBackgroundEventsAction =
'CronjobController:getBackgroundEvents';