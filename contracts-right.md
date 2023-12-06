## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0xe929743b5e4Ec0966bDc08dF8320802BD5A8C63D ---target-adapter-address 0xc51B10A545d646A6D648F6e25B037D07B9ED1211 --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

==========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF --adapter-address 0xe929743b5e4Ec0966bDc08dF8320802BD5A8C63D --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 43113 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0xe929743b5e4Ec0966bDc08dF8320802BD5A8C63D 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846

pnpm hardhat verify --network 43113 --contract contracts/Bridge.sol:Bridge 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 43113

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x95A253D055bACD9e3B8c943b8c23a44a455f62bF --adapter-address 0xe929743b5e4Ec0966bDc08dF8320802BD5A8C63D --target-network 80001 --fee-token-name LINK

# Execute

==========================
pnpm hardhat execute-message --network 43113 --adapter-address 0x7f188288e39197B7e55EC4E08a9f19f56A8580e8
