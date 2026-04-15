import { useSelector } from 'react-redux';

import { selectInternalAccounts } from '../../../selectors/accountsController';


export function useInternalAccountNames(requests) {
  const internalAccounts = useSelector(selectInternalAccounts);

  return requests.map((request) => {
    const { value } = request;
    const foundAccount = internalAccounts.find(
      (account) => account.address.toLowerCase() === value.toLowerCase()
    );
    return foundAccount?.metadata?.name;
  });
}