import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import { selectContractBalances } from '../../../selectors/tokenBalancesController';





const useTokenBalancesController = () => {
  const tokenBalances = useSelector(selectContractBalances, isEqual);

  return { data: tokenBalances };
};

export default useTokenBalancesController;