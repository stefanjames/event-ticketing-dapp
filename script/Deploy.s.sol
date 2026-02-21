// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        EventTicketing ticketing = new EventTicketing();
        console.log("EventTicketing deployed to:", address(ticketing));

        vm.stopBroadcast();
    }
}
