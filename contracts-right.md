## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

=========================

pnpm hardhat deploy-bridge-contract --network 43113

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x15F297bc982D7354D3a1024CBcabdA0E83007f09 --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x15F297bc982D7354D3a1024CBcabdA0E83007f09 --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x1989d6da15E3C431EfdD28eCa2fC4355C6F97b00 ---target-adapter-address 0xBd770416a3345F91E4B34576cb804a576fa48EB1 --is-enabled true --gas-limit 3000000

=========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x15F297bc982D7354D3a1024CBcabdA0E83007f09 --adapter-address 0x1989d6da15E3C431EfdD28eCa2fC4355C6F97b00 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --adapter-bytes4-signature 0x85572ffb --adapter-contract-name "CCIPAdapter"

=========================

pnpm hardhat deploy-test-nft-contract --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x15F297bc982D7354D3a1024CBcabdA0E83007f09 --adapter-address 0x1989d6da15E3C431EfdD28eCa2fC4355C6F97b00 --target-network 80001
