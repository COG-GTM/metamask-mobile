import ActivityScreen from "../screen-objects/ActivityScreen";
import { Then } from '@wdio/cucumber-framework';

Then(/^"([^"]*)?" transaction is displayed/, async (tx: string) => {
    await ActivityScreen.isTransactionDisplayed(tx);
});
