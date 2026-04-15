

import Routes from '../../../../constants/navigation/Routes';

const RAMP_ACTIVITY = 'activity';

export default function handleRedirection(
paths,
_pathParams,
_rampType,
navigation)
{
  switch (paths[0]) {
    case RAMP_ACTIVITY:{
        navigation.navigate(Routes.TRANSACTIONS_VIEW, {
          screen: Routes.TRANSACTIONS_VIEW,
          params: {
            redirectToOrders: true
          }
        });
        break;
      }

    default:{
        break;
      }
  }
}