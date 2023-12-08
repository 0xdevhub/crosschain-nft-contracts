## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================

pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C ---target-adapter-address 0xBa9F52986D0633Ee57B412cA724455A4710cEa00 --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

==========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a --adapter-address 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 43113 --contract contracts/Bridge.sol:Bridge 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a 0xA77Bb3B4aC78198208922A6c919921b274be0F9c 43113

pnpm hardhat verify --network 43113 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 0xA77Bb3B4aC78198208922A6c919921b274be0F9c 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846

# Deploy and bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "Doodle" --token-symbol "DOD" --bridge-address 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a --adapter-address 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C --target-network 80001 --fee-token-name LINK

# Execute

==========================
pnpm hardhat execute-message --network 43113 --adapter-address 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C

# Bridge existent ERC721 token

===============================

pnpm hardhat bridge-erc721 --network 43113 --token-address 0x59fD265001A751e8ed32274FaFb40103Ed673FaA --token-id 1 --bridge-address 0x16Ea9dA3B8E4984e47410A999E03A17bBadbc89a --adapter-address 0xB6d40F6c6D068Ed9708d59420c345eCf3E0C977C --target-network 80001 --fee-token-name LINK --origin-chain-evm-id 80001
