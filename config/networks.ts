const networks = {}

if (process.env.NODE_ENV !== 'development') {
  Object.assign(networks, {
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.MUMBAI_API_KEY}`,
      chainId: 80001,
      accounts: [
        String(process.env.ACCOUNTS_PRIVATE_KEY_1),
        String(process.env.ACCOUNTS_PRIVATE_KEY_2)
      ]
    }
  })
}

export { networks }
