import { Ledger } from 'ual-ledger'
import { Lynx } from 'ual-lynx'
//import { Scatter } from 'ual-scatter'
import { Anchor } from 'ual-anchor'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import * as React from 'react'
import ReactDOM from 'react-dom'

import { createClient } from "@liquidapps/dapp-client";

import TransactionApp from './TransactionApp'


const kylinTestnet = {
  chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
  rpcEndpoints: [{
    protocol: "http",
    host: "kylin.eosn.io",
    port: 80,
  }]
}

const TestAppConsumer = withUAL(TransactionApp)

TestAppConsumer.displayName = 'TestAppConsumer'

const appName = 'My App'
const lynx = new Lynx([kylinTestnet])
const ledger = new Ledger([kylinTestnet])
//const scatter = new Scatter([kylinTestnet], { appName })
const anchor = new Anchor([kylinTestnet], { appName })

ReactDOM.render(
<div>
  <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
    <TestAppConsumer />
    <TestAppConsumer />
  </UALProvider>
  <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
    <TestAppConsumer />
  </UALProvider>
</div>,
  document.getElementById('ual-app') as HTMLElement,
)

ReactDOM.render(
  <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
    <TestAppConsumer />
  </UALProvider>,
  document.getElementById('ual-app2') as HTMLElement,
)
