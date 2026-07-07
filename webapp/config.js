// Network + token configuration for the Decimal Wallet (watch-only).
// Balances are read live from the blockchain for the address you enter.
// To add a token, append an entry to `tokens` with its real contract address.
window.DECIMAL_WALLET_CONFIG = {
  chainId: '56',
  network: 'bsc',
  rpcUrl: 'https://bsc-dataseed.bnbchain.org',
  explorer: 'https://bscscan.com',
  dappName: 'Decimal Wallet',

  // Native coin of the chain (BNB on BSC). Balance is read via eth_getBalance.
  native: {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    // CoinGecko id used to fetch a live USD price (optional; null = no price).
    coingeckoId: 'binancecoin'
  },

  // ERC-20 / BEP-20 tokens. Balance is read via balanceOf(address).
  // `coingeckoId` is optional and only used to show a live USD value.
  // `staticUsdPrice` can pin a price (e.g. stablecoins) when no market exists.
  // Known tokens keep an explicit symbol/name/price; the rest only need an
  // address — the app resolves symbol/name/decimals live from the chain and
  // silently skips any address that is not a valid ERC-20 contract.
  tokens: [
    {
      symbol: 'SHOS',
      name: 'SHOS Token',
      address: '0x4995A93d89a47731fb1d750c0092f0e23f505b28',
      coingeckoId: null,
      staticUsdPrice: null
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      coingeckoId: null,
      staticUsdPrice: 1
    },
    { address: '0xcad58a72652a40f969a30c3604af31362dfc261d' },
    { address: '0x5cab8aee5c77806b9a67450e8bd57109e35e7f6e' },
    { address: '0x1c9cb13701b60c6e941412e208edebbc5e5cac80' },
    { address: '0x2cf11cb8873f6f8d7bd9b5fa535262e712a41ad3' },
    { address: '0xbc917dbc5390e5c42083017da97da534f26c276a' },
    { address: '0x288c72aab7e6d1f688964c95404bc34dc0978528' },
    { address: '0x0e1908362a14802bb2b0448ba7c67432a11ff920' },
    { address: '0x18a2cf4f504d9037a9ee2e3e61ff44c36eaf60c7' },
    { address: '0x4f77633a29e79370f99d68d698acc0424f1c5c63' },
    { address: '0xf0f6929d4a7aa2e7622e703fd1850524aa81ca54' },
    { address: '0x61b00c7be7c0a9be08ba39ef0939d17099a1ddb9' },
    { address: '0x9e1d136564f3f5898ca80866ec639336840df984' },
    { address: '0x03ec24a5c7902007ce9acf65c0e9966ed5db2f32' },
    { address: '0x1df7ab3049c9465f0e264a932933141654328e7a' },
    { address: '0x04c12c4ea00c63323de9fdeabadd1ce048f19066' },
    { address: '0x153bc292ab97d4acc2cbfb1b79b25f934efe5992' },
    { address: '0xf3162950df0b4ba17a65fb7a5dd7dff3c91ef190' },
    { address: '0xB4c28b0558196A0bccc8C159C2A93C144e85D300' },
    { address: '0x07463ee1ba9c1fbfd6755965f89eb034276ff505' },
    { address: '0x07b2575b5212c38ac8763e6d360f075f5d6e10e5' },
    { address: '0x0dfbe983b02ba5eff9dced9df855485700840afc' },
    { address: '0x0000000000d4f82814c07974ee1c0ea4b7632c7e' },
    { address: '0x013dce9327a30c199b9f3c3d874a65dc7e3409ac' },
    { address: '0xc068cbf21ac99cedfcc8973d66f20d7f235a3ba2' },
    { address: '0x569b2cf0b745ef7fad04e8ae226251814b3395f9' },
    { address: '0x532e50ed4c510561256f25da0d86f55556b13c49' },
    { address: '0xb97844eb21da50b3b2db26ab1083f74b1957c247' },
    { address: '0x5e48c354a5da2b0a8c203518d0fc7b9c58cc9329' },
    { address: '0x575b0339a30d5f29dcbc444ab28f2b194a5e2fa7' },
    { address: '0x6bb43e324abc3c7ac2b99b0ab0ba8e6d469c83aa' },
    { address: '0x5f7cea209b42d090810b6af77381a8d940cca6d2' },
    { address: '0x585de5430f47aba099bebd21ef133272c38db7a6' },
    { address: '0x61567eb10ef0ea34b12ec19eadbaeba5873a12f5' },
    { address: '0x7b00a14d199499e39ae92b6c49f1c47ffaa1be5a' },
    { address: '0x3333606fcd1d09ea9c1c25320b27543e619b8399' },
    { address: '0xABD6C21130A21289217F848a0D279a36a99CC2fa' }
  ]
};
