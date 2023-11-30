## Contracts

do not use this contract, is just a test

=========================

pnpm hardhat deploy-bridge-contract --network 43113

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0xeFAf71cB2f725C4e62cEEaf9A25E9aB633D3Ed7E --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xeFAf71cB2f725C4e62cEEaf9A25E9aB633D3Ed7E --evm-chain-id 420 --non-evm-chain-id 2664363617261496610 --adapter-address 0x8651CB6C73a135E5192f1631A19d303e61098cB8 ---target-adapter-address 0x2c9d91e6decE195dFD7841Ef978e91891d52d7B7 --is-enabled true --gas-limit 3000000

=========================
pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x061BdBE143eD552f4eD369AEd369fbB810195740 --adapter-address 0x4cD61677e32724551965cB814fA5f97c023674A8 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0xeFAf71cB2f725C4e62cEEaf9A25E9aB633D3Ed7E --adapter-address 0x8651CB6C73a135E5192f1631A19d303e61098cB8 --target-network 420
