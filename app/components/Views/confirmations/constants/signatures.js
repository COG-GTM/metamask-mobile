/**
 * The contents of this file have been taken verbatim from
 * metamask-extension/shared/constants/signatures.ts
 *
 * If updating, please be mindful of this or delete this comment.
 */

export let PrimaryTypeOrder = /*#__PURE__*/function (PrimaryTypeOrder) {PrimaryTypeOrder["Order"] = "Order";PrimaryTypeOrder["OrderComponents"] = "OrderComponents";return PrimaryTypeOrder;}({});




export let PrimaryTypePermit = /*#__PURE__*/function (PrimaryTypePermit) {PrimaryTypePermit["Permit"] = "Permit";PrimaryTypePermit["PermitBatch"] = "PermitBatch";PrimaryTypePermit["PermitBatchTransferFrom"] = "PermitBatchTransferFrom";PrimaryTypePermit["PermitSingle"] = "PermitSingle";PrimaryTypePermit["PermitTransferFrom"] = "PermitTransferFrom";return PrimaryTypePermit;}({});







/**
 * EIP-712 Permit PrimaryTypes
 */
export const PrimaryType = {
  ...PrimaryTypeOrder,
  ...PrimaryTypePermit
};

// Create a type from the const object


export const PRIMARY_TYPES_ORDER =
Object.values(PrimaryTypeOrder);
export const PRIMARY_TYPES_PERMIT =
Object.values(PrimaryTypePermit);
export const PRIMARY_TYPES = Object.values(PrimaryType);

export let ResultType = /*#__PURE__*/function (ResultType) {ResultType["Benign"] = "Benign";ResultType["Malicious"] = "Malicious";ResultType["Warning"] = "Warning";




  // MetaMask defined result types
  ResultType["Failed"] = "Failed";ResultType["RequestInProgress"] = "RequestInProgress";return ResultType;}({});