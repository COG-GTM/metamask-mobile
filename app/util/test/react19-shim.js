// React 19 compatibility shim for react-shallow-renderer and enzyme
// React 19 renamed __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED to
// __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.
// This shim must run before any module that depends on the old name.
const React = require('react');
if (
  !React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
) {
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
}
