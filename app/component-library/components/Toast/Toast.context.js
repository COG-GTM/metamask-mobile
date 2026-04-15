/* eslint-disable react/prop-types */

// Third party dependencies.
import React, { useRef } from 'react';

// Internal dependencies.


export const ToastContext = React.createContext({
  toastRef: undefined
});

export const ToastContextWrapper = ({
  children
}) => {
  const toastRef = useRef(null);
  return (
    <ToastContext.Provider value={{ toastRef }}>
      {children}
    </ToastContext.Provider>);

};