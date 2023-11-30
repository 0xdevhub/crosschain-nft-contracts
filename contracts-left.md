## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

=========================

pnpm hardhat deploy-bridge-contract --network 80001

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x12dB534918D164AbF0eAB8A9a2a5949431ddfc35 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x12dB534918D164AbF0eAB8A9a2a5949431ddfc35 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x8e5d796cf9BE6e49cE5581843113e3E2F67C8Af7 ---target-adapter-address 0x4A7d57684FE9462e0Df95E57e37FF219B7642A13 --is-enabled true --gas-limit 3000000

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x061BdBE143eD552f4eD369AEd369fbB810195740 --adapter-address 0x4cD61677e32724551965cB814fA5f97c023674A8 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x12dB534918D164AbF0eAB8A9a2a5949431ddfc35 --adapter-address 0x8e5d796cf9BE6e49cE5581843113e3E2F67C8Af7 --target-network 43113
