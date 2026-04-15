import { useMemo } from 'react';
import { useAccounts } from '../../../hooks/useAccounts';


const useSelectedAccount = () => {
  const { evmAccounts: accounts } = useAccounts();

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.isSelected),
    [accounts]
  );

  return selectedAccount;
};

export default useSelectedAccount;