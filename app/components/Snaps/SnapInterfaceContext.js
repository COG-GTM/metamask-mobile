import {




  UserInputEventType } from
'@metamask/snaps-sdk';
import React, {

  createContext,
  useContext,
  useEffect,
  useRef } from
'react';
import { mergeValue } from './SnapUIRenderer/utils';
import Engine from '../../core/Engine/Engine';
import { HandlerType } from '@metamask/snaps-utils';
import { handleSnapRequest } from '../../core/Snaps/utils';


























export const SnapInterfaceContext =
createContext(null);







/**
 * The Snap interface context provider that handles all the interface state operations.
 *
 * @param params - The context provider params.
 * @param params.children - The childrens to wrap with the context provider.
 * @param params.interfaceId - The interface ID to use.
 * @param params.snapId - The Snap ID that requested the interface.
 * @param params.initialState - The initial state of the interface.
 * @returns The context provider.
 */
export const SnapInterfaceContextProvider =

({ children, interfaceId, snapId, initialState }) => {
  // We keep an internal copy of the state to speed up the state update in the
  // UI. It's kept in a ref to avoid useless re-rendering of the entire tree of
  // components.
  const internalState = useRef(initialState ?? {});
  const focusedInput = useRef(null);

  // Since the internal state is kept in a reference, it won't update when the
  // interface is updated. We have to manually update it.
  useEffect(() => {
    internalState.current = initialState;
  }, [initialState]);

  const controllerMessenger = Engine.controllerMessenger;

  const rawSnapRequestFunction = (
  event,
  name,
  value) =>
  {
    handleSnapRequest(controllerMessenger, {
      snapId: snapId,
      origin: 'metamask',
      handler: HandlerType.OnUserInput,
      request: {
        jsonrpc: '2.0',
        method: ' ',
        params: {
          event: {
            type: event,
            ...(name !== undefined && name !== null ? { name } : {}),
            ...(value !== undefined && value !== null ? { value } : {})
          },
          id: interfaceId
        }
      }
    });
  };

  const updateState = (state) =>
  Engine.context.SnapInterfaceController.updateInterfaceState(
    interfaceId,
    state
  );
  /**
   * Handle the submission of an user input event to the Snap.
   *
   * @param options - An options bag.
   * @param options.event - The event type.
   * @param options.name - The name of the component emitting the event.
   * @param options.value - The value of the component emitting the event.
   */
  const handleEvent = ({
    event,
    name,
    value = name ? internalState.current[name] : undefined
  }) => rawSnapRequestFunction(event, name, value);

  const submitInputChange = (name, value) =>
  handleEvent({
    event: UserInputEventType.InputChangeEvent,
    name,
    value
  });

  /**
   * Handle the value change of an input.
   *
   * @param name - The name of the input.
   * @param value - The new value.
   * @param form - The name of the form containing the input.
   * Optional if the input is not contained in a form.
   */
  const handleInputChange = (name, value, form) => {
    const state = mergeValue(internalState.current, name, value, form);

    internalState.current = state;
    updateState(state);
    submitInputChange(name, value);
  };

  /**
   * Get the value of an input from the interface state.
   *
   * @param name - The name of the input.
   * @param form - The name of the form containing the input.
   * Optional if the input is not contained in a form.
   * @returns The value of the input or undefined if the input has no value.
   */
  const getValue = (name, form) => {
    const value = form ?
    initialState[form]?.[name] :
    initialState?.[name];

    if (value !== undefined && value !== null) {
      return value;
    }

    return undefined;
  };

  const setCurrentFocusedInput = (name) => {
    focusedInput.current = name;
  };

  return (
    <SnapInterfaceContext.Provider
      value={{
        handleEvent,
        getValue,
        handleInputChange,
        setCurrentFocusedInput,
        focusedInput: focusedInput.current,
        snapId
      }}>
      
      {children}
    </SnapInterfaceContext.Provider>);

};

/**
 * The utility hook to consume the Snap inteface context.
 *
 * @returns The snap interface context.
 */
export function useSnapInterfaceContext() {
  return useContext(SnapInterfaceContext);
}