import React from 'react';

import { useSelector } from 'react-redux';
import { selectAppServicesReady } from '../../../reducers/user/selectors';
import FoxLoader from '../../UI/FoxLoader';
/**
 * A higher order component that gate keeps the children until the app services are finished loaded
 *
 * @param props - The props for the ControllersGate component
 * @param props.children - The children to render
 * @returns - The ControllersGate component
 */
const ControllersGate = ({
  children
}) => {
  const appServicesReady = useSelector(selectAppServicesReady);

  return (
    <React.Fragment>
      {appServicesReady ? children : <FoxLoader />}
    </React.Fragment>);

};

export default ControllersGate;