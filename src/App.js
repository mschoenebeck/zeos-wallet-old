import * as React from 'react'
import { useState, useEffect } from 'react'

import { Ledger } from 'ual-ledger'
import { Lynx } from 'ual-lynx'
//import { Scatter } from 'ual-scatter'
import { Anchor } from 'ual-anchor'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'

import ZEOSWallet from './ZEOSWallet'

const kylinTestnet = {
    chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
    rpcEndpoints: [{
      protocol: "http",
      host: "kylin.eosn.io",
      port: 80,
    }]
  }

function App()
{
    ZEOSWallet.displayName = 'ZEOSWallet'
    const ZEOSWalletUAL = withUAL(ZEOSWallet)
    ZEOSWalletUAL.displayName = 'ZEOSWalletUAL'

    const appName = 'My App'
    const lynx = new Lynx([kylinTestnet])
    const ledger = new Ledger([kylinTestnet])
    //const scatter = new Scatter([kylinTestnet], { appName })
    const anchor = new Anchor([kylinTestnet], { appName })

    return (
        <div>
            <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
                <ZEOSWalletUAL rpc={new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)} />
            </UALProvider>
            <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
                <ZEOSWalletUAL />
            </UALProvider>
        </div>
    )
}

export default App