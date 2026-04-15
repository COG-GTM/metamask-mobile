
import { ResultType as BlockaidResultType } from '../../../constants/signatures';

export let Reason = /*#__PURE__*/function (Reason) {Reason["approvalFarming"] = "approval_farming";Reason["blurFarming"] = "blur_farming";Reason["maliciousDomain"] = "malicious_domain";Reason["other"] = "other";Reason["permitFarming"] = "permit_farming";Reason["rawNativeTokenTransfer"] = "raw_native_token_transfer";Reason["rawSignatureFarming"] = "raw_signature_farming";Reason["seaportFarming"] = "seaport_farming";Reason["setApprovalForAllFarming"] = "set_approval_for_all_farming";Reason["tradeOrderFarming"] = "trade_order_farming";Reason["transferFarming"] = "transfer_farming";Reason["transferFromFarming"] = "transfer_from_farming";













  // MetaMask defined reasons
  Reason["failed"] = "failed";Reason["notApplicable"] = "not_applicable";Reason["requestInProgress"] = "request_in_progress";return Reason;}({});




export const ResultType = BlockaidResultType;




















/**
 * Style sheet input parameters.
 */


export let SecurityAlertSource = /*#__PURE__*/function (SecurityAlertSource) {
  /** Validation performed remotely using the Security Alerts API. */SecurityAlertSource["API"] = "api";


  /** Validation performed locally using the PPOM. */SecurityAlertSource["Local"] = "local";return SecurityAlertSource;}({});