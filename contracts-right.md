## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0xcae74Ff0366797EB0d65E019A5375d949B02a165 --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xcae74Ff0366797EB0d65E019A5375d949B02a165 --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 ---target-adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

==========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0xcae74Ff0366797EB0d65E019A5375d949B02a165 --adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 43113 --contract contracts/Bridge.sol:Bridge 0xcae74Ff0366797EB0d65E019A5375d949B02a165 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 43113

pnpm hardhat verify --network 43113 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 0xcae74Ff0366797EB0d65E019A5375d949B02a165 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113--token-name "Doodle" --token-symbol "DOD" --bridge-address 0xcae74Ff0366797EB0d65E019A5375d949B02a165 --adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 --target-network 80001 --fee-token-name LINK

# Execute

==========================
pnpm hardhat execute-message --network 43113 --adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291

===============================

pnpm hardhat bridge-erc721 --network 43113 --token-address 0xa7Ef3a94D78c444054FB15d583FeD9127D4b5C81 --token-id 1 --bridge-address 0xcae74Ff0366797EB0d65E019A5375d949B02a165 --adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 --target-network 80001 --fee-token-name LINK --origin-chain-evm-id 80001
