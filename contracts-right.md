## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

=========================

pnpm hardhat deploy-bridge-contract --network 43113

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0xee9e23bf38A771E4899627C85A79385E70Ee254d --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xee9e23bf38A771E4899627C85A79385E70Ee254d --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x4A7d57684FE9462e0Df95E57e37FF219B7642A13 ---target-adapter-address 0x7634f8DF9d00C1A445062D908aB129BE65DF7AB9 --is-enabled true --gas-limit 3000000

=========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x061BdBE143eD552f4eD369AEd369fbB810195740 --adapter-address 0x4cD61677e32724551965cB814fA5f97c023674A8 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0xee9e23bf38A771E4899627C85A79385E70Ee254d --adapter-address 0x4A7d57684FE9462e0Df95E57e37FF219B7642A13 --target-network 80001
