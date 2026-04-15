import { AnvilManager, defaultOptions } from './anvil-manager';



async function main() {
  const server = new AnvilManager();
  await server.start(defaultOptions);

  const accounts = await server.getAccounts();
  const firstAccount = accounts[0];
  const balanceInWei = '10';

  await server.setAccountBalance(balanceInWei, firstAccount);

  // eslint-disable-next-line no-console
  console.log(accounts);

  await server.quit();
}

main();