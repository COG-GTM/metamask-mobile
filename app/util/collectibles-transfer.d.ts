/**
 * Type declaration for the extension-less import of `collectibles-transfer.json`,
 * which TypeScript cannot resolve on its own.
 */
declare const collectiblesTransferInformation: Record<
  string,
  {
    name: string;
    tradable: boolean;
    method?: string;
  }
>;

export default collectiblesTransferInformation;
