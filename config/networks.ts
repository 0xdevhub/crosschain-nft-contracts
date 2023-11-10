export const networks = {
  mumbai: {
    url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.MUMBAI_API_KEY}`,
    accounts: [String(process.env.ACCOUNTS_PRIVATE_KEY_1)]
  }
}
