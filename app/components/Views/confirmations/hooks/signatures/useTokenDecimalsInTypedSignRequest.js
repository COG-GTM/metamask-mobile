

import { getTokenContractInDataTree } from '../../components/info/typed-sign-v3v4/message';
import { isRecognizedPermit, isRecognizedOrder } from '../../utils/signature';
import { useGetTokenStandardAndDetails } from '../useGetTokenStandardAndDetails';

export const useTokenDecimalsInTypedSignRequest = (
signatureRequest,
data,
verifyingContract) =>
{
  const isPermit = isRecognizedPermit(signatureRequest);
  const isOrder = isRecognizedOrder(signatureRequest);
  const verifyingContractAddress =
  isPermit || isOrder ? verifyingContract : undefined;
  const {
    details: { decimalsNumber: verifyingContractTokenDecimalsNumber } = {}
  } = useGetTokenStandardAndDetails(verifyingContractAddress);

  const tokenContract = getTokenContractInDataTree(
    data
  );
  const { details: { decimalsNumber } = {} } =
  useGetTokenStandardAndDetails(tokenContract);
  return typeof decimalsNumber === 'number' ?
  decimalsNumber :
  verifyingContractTokenDecimalsNumber;
};