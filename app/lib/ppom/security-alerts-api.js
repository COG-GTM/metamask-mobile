
import AppConstants from '../../core/AppConstants';

const ENDPOINT_VALIDATE = 'validate';






export function isSecurityAlertsAPIEnabled() {
  return process.env.MM_SECURITY_ALERTS_API_ENABLED === 'true';
}

export async function validateWithSecurityAlertsAPI(
chainId,
body)
{
  const endpoint = `${ENDPOINT_VALIDATE}/${chainId}`;
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

async function request(endpoint, options) {
  const url = getUrl(endpoint);

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Security alerts API request failed with status: ${response.status}`
    );
  }

  return response.json();
}

function getUrl(endpoint) {
  const host = AppConstants.SECURITY_ALERTS_API.URL;

  if (!host) {
    throw new Error('Security alerts API URL is not set');
  }

  return `${host}/${endpoint}`;
}