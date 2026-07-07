# TokenPocket SDK Wallet Protocol
#### Version：v2.0

### Authorize

~~~
{
    protocol	string   // protocol name TokenPocket
    version     string   // 
    dappName    string   // 
    dappIcon    string   // 
    blockchain  string   // network  "eos evm tron iost"
    blockchains array    // network [{"chainId": "1","network": "ethereum"}]，if you want do action with evm network, use blockchains replace blockchain
    action      string   // login
    actionId    string   //  
    callbackUrl string   // provided by dapp server to get result
}
~~~



### Transfer
~~~
{
    protocol	string   // protocol name TokenPocket
    version     string   // 
    dappName    string   // 
    dappIcon    string   // 
    blockchain  string   // network  "eos evm tron iost"
    blockchains array    // network [{"chainId": "1","network": "ethereum"}]，if you want do action with evm network, use blockchains replace blockchain
    action      string   // transfer
    actionId    string   //  
    from        string   // 
    to          string   // 
    amount      number   // 
    contract    string   
    symbol      string   
    decimal     number   // evm network decimal
    precision   number   // eos network precison
    memo        string   	     
    callbackUrl string   // provided by dapp server to get result
}
~~~

### Sign message

~~~
{
    protocol	string   // protocol name TokenPocket
    version     string   // 
    dappName    string   // 
    dappIcon    string   // 
    blockchain  string   // network  "eos evm tron iost"
    blockchains array    // network [{"chainId": "1","network": "ethereum"}]，if you want do action with evm network, use blockchains replace blockchain
    action      string   // sign
    actionId    string   //  
    message     string   // message to sign
    signType    string   // for evm network,support ethSign and ethPersonalSign
    callbackUrl string   // provided by dapp server to get result
}
~~~


### Sign and push common tx
~~~
    protocol	string   // protocol name TokenPocket
    version     string   // 
    dappName    string   // 
    dappIcon    string   // 
    blockchain  string   // network  "eos evm tron iost"
    blockchains array    // network [{"chainId": "1","network": "ethereum"}]，if you want do action with evm network, use blockchains replace blockchain
    action      string   // transfer
    actionId    string   //  
    
    payload     string   // used by iost network to set tx data
    actions     string   // used by eos network to set tx data
    txData      string   // used by evm and tron network to set tx data

    callbackUrl string   // provided by dapp server to get result
~~~
About "txData": [DEMO](https://github.com/TP-Lab/tp-wallet-sdk/blob/master/TxData%20Example.md)



SDK details：https://github.com/TP-Lab/Mobile-SDK

---

## Reference TypeScript SDK

This repo also ships a small, dependency-free reference implementation of the
protocol above under `src/`. It builds protocol requests, encodes them into
wallet deeplinks / QR payloads, and parses callback results.

```bash
npm install        # install dev dependencies
npm test           # run the unit tests
npm run test:coverage
npm run build      # emit dist/
```

```ts
import { TpWalletSdk } from 'tp-wallet-sdk';

const sdk = new TpWalletSdk({ dappName: 'My DApp' });

const req = sdk.transfer({
  actionId: 'order-1',
  blockchain: 'evm',
  to: '0x5Da73693A062a11589F1b5c68434bf7eAff72366',
  amount: 0.01,
  callbackUrl: 'https://dapp.example/callback'
});

const deeplink = sdk.toDeeplink(req); // tpoutside://pull.activity?param=...
```

Modules:

- `constants` – protocol name/version, action, blockchain and sign-type enums.
- `types` – request/response TypeScript interfaces.
- `validation` – field guards and network-targeting validation.
- `requests` – builders for authorize / transfer / sign / push-transaction.
- `encoding` – base64url + deeplink / QR (de)serialization.
- `callback` – parsing and normalization of wallet callback results.
