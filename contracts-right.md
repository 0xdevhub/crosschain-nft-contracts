## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

=========================

pnpm hardhat deploy-bridge-contract --network 43113

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x8aF45113DB6AE7D25ad6E1e40Eb53470158c8Ed5 --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x8aF45113DB6AE7D25ad6E1e40Eb53470158c8Ed5 --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x998F8187B79705bd9c4cABA39115157B2393801c ---target-adapter-address 0x3fb3D961fFB2f632748Bdb22F7AfC141384A38EF --is-enabled true --gas-limit 33702510

=========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0xFECd3D419ce5617A182490BbE356a972F7E04FA9 --adapter-address 0x8Df0F02c9B069b76dF4d94d37fa102Ee965cfc93 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x8aF45113DB6AE7D25ad6E1e40Eb53470158c8Ed5 --adapter-address 0x998F8187B79705bd9c4cABA39115157B2393801c --target-network 80001
