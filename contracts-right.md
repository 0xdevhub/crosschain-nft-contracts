## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

=========================

pnpm hardhat deploy-bridge-contract --network 43113

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x0b17e2c8aA8cEB71E6C5d40AdB77e57966b31651 --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x0b17e2c8aA8cEB71E6C5d40AdB77e57966b31651 --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0xD1c5abc7c1673fF9ab5fb21a2EF91d7a3EB539C3 ---target-adapter-address 0x01433417E5C1Bd6468CEE60CA3260A730Af75d58 --is-enabled true

=========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x0b17e2c8aA8cEB71E6C5d40AdB77e57966b31651 --adapter-address 0xD1c5abc7c1673fF9ab5fb21a2EF91d7a3EB539C3 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================
