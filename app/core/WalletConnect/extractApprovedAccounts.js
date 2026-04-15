


export const extractApprovedAccounts = (
accountPermission) =>


{
  const approvedAccounts = accountPermission?.caveats?.
  map((caveat) => {
    if (Array.isArray(caveat?.value)) {
      return caveat.value;
    }
    return undefined;
  }).
  flat();
  return approvedAccounts;
};

export default extractApprovedAccounts;