// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract Hub is AccessManaged {
    struct App {
        address appAddress;
        string name;
        string description;
    }

    /// @notice The salt used to generate appIds
    uint256 private s_appIdSalt;

    mapping(bytes32 => App) private s_apps;

    /// @notice Emitted when an app is added to the hub
    event Hub_AppAdded(bytes32 indexed appId_);

    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    /**
     * @notice Adds an app to the hub
     * @param appAddress_ The address of the app contract
     * @return The id of the app
     */
    function addApp(
        address appAddress_,
        string memory name_,
        string memory description_
    ) external restricted returns (bytes32) {
        bytes32 appId = _getNextAppId(appAddress_);
        s_apps[appId] = App({appAddress: appAddress_, name: name_, description: description_});

        emit Hub_AppAdded(appId);

        return appId;
    }

    /**
     * @notice Gets the next app id
     * @param appAddress_ The address of the app contract
     * @return The id of the app
     */
    function _getNextAppId(address appAddress_) private returns (bytes32) {
        return keccak256(abi.encodePacked(_getNextAppIdSalt(), msg.sender, appAddress_));
    }

    /**
     * @notice Gets the next app id salt
     * @return The next app id salt
     */
    function _getNextAppIdSalt() private returns (uint256) {
        return s_appIdSalt++;
    }

    /**
     * @notice Gets an app from the hub
     * @param appId_ The id of the app
     * @return The app
     */
    function getApp(bytes32 appId_) external view returns (App memory) {
        return s_apps[appId_];
    }
}
