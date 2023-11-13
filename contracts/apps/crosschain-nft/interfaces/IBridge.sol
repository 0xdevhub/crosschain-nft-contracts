// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBaseAdapter} from "./IBaseAdapter.sol";

interface IBridge {
    event AdapterChange(IBaseAdapter indexed adapter_);

    function adapter() external view returns (IBaseAdapter);

    function setAdapter(IBaseAdapter adapter_) external;

    function lockAndMintERC721() external;

    function burnAndUnlockERC721() external;

    function commitOffRamp(bytes memory calldata_) external returns (bytes memory);
}
