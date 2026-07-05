// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../IRoles.sol";

contract MockRolesRegistry is AccessControl, IRoles {
    bytes32 public constant AUTO_GRANT_ROLE = keccak256("AUTO_GRANT_ROLE");
    bytes32 public constant override CURATOR_ROLE = keccak256("CURATOR_ROLE");
    bytes32 public constant override REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function hasRole(bytes32 role, address account)
        public
        view
        override(AccessControl, IRoles)
        returns (bool)
    {
        return super.hasRole(role, account);
    }

    function grantUserRole(bytes32 role, address account) external override onlyRole(AUTO_GRANT_ROLE) {
        _grantRole(role, account);
    }
}
