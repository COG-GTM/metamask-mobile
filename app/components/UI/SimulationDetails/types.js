


export let AssetType = /*#__PURE__*/function (AssetType) {AssetType["Native"] = "NATIVE";AssetType["ERC20"] = "ERC20";AssetType["ERC721"] = "ERC721";AssetType["ERC1155"] = "ERC1155";return AssetType;}({});






/**
 * Describes an amount of fiat.
 */
export const FIAT_UNAVAILABLE = null;



/**
 * Identifies the native asset of a chain.
 */







/**
 * Uniquely identifies a token asset on a chain.
 */











export let TokenStandard = /*#__PURE__*/function (TokenStandard) {
  /** A token that conforms to the ERC20 standard. */TokenStandard["ERC20"] = "ERC20";

  /** A token that conforms to the ERC721 standard. */TokenStandard["ERC721"] = "ERC721";

  /** A token that conforms to the ERC1155 standard. */TokenStandard["ERC1155"] = "ERC1155";

  /** Not a token, but rather the base asset of the selected chain. */TokenStandard["none"] = "NONE";return TokenStandard;}({});



/**
 * Describes a change in an asset's balance to a user's wallet.
 */