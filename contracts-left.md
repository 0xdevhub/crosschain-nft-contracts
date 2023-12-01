## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

=========================

pnpm hardhat deploy-bridge-contract --network 80001 --account-index 1

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0xAa38cabdEd065835861d5Bc0dAed06bfc6a94062 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --account-index 1

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0xAa38cabdEd065835861d5Bc0dAed06bfc6a94062 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x01433417E5C1Bd6468CEE60CA3260A730Af75d58 ---target-adapter-address 0xD1c5abc7c1673fF9ab5fb21a2EF91d7a3EB539C3 --is-enabled true --account-index 1

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0xAa38cabdEd065835861d5Bc0dAed06bfc6a94062 --adapter-address 0x01433417E5C1Bd6468CEE60CA3260A730Af75d58 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x3b89046C763c3C8aCD5b62d3c61805b205395957 --adapter-address 0x3fb3D961fFB2f632748Bdb22F7AfC141384A38EF --target-network 43113 --account-index 1
