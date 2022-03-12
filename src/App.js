import * as React from 'react'
import { useState, useEffect } from 'react'

import { Ledger } from 'ual-ledger'
import { Lynx } from 'ual-lynx'
//import { Scatter } from 'ual-scatter'
import { Anchor } from 'ual-anchor'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'
import { createClient } from "@liquidapps/dapp-client";
import { Asset } from '@greymass/eosio'

import ZEOSWallet from './ZEOSWallet'
import KeyManagement from './components/KeyManagement'

import { Console, Hook, Unhook } from 'console-feed'

const kylinTestnet = {
  chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
  rpcEndpoints: [
    {
      protocol: "https",
      host: "kylin-dsp-1.liquidapps.io",
      port: 443,
    },
    {
      protocol: "http",
      host: "kylin.eosn.io",
      port: 80,
    }
  ]
}

function App()
{
  // set state variables
  const [keyPairs, setKeyPairs] = useState([]);
  const [selectedKey, setSelectedKey] = useState(-1);
  const [logs, setLogs] = useState([]) // https://github.com/samdenty/console-feed

  // run once!
  useEffect(() => {
    Hook(
      window.console,
      (log) => setLogs((currLogs) => [...currLogs, log]),
      false
    )
    return () => Unhook(window.console)
  }, [])

  async function onCreateNewKey()
  {
    // can create randomness here in JS or in RUST by passing an empty seed
    //var seed = Array.from({length: 32}, () => Math.floor(Math.random() * 256))
    var kp = JSON.parse(await zeos_create_key([]))
    kp.id  = keyPairs.length
    kp.gs_tx_count = 0;
    kp.gs_mt_leaf_idx = 0;
    kp.transactions = [];
    kp.nullifier = [];
    kp.spendable_notes = [];
    setKeyPairs([...keyPairs, kp])
    document.getElementById("key-select").value = kp.id
    setSelectedKey(kp.id)
    //console.log(kp)
  }

  function onKeySelect()
  {
    var e = document.getElementById("key-select");
    setSelectedKey(e.value)
    //console.log(selectedKey)
  }

  function onDeleteKey()
  {
    var newKeyPairs = keyPairs.filter((kp) => {return(kp.id != selectedKey)})
    setKeyPairs(newKeyPairs)
    document.getElementById("key-select").value = newKeyPairs.length-1
    setSelectedKey(newKeyPairs.length-1)
    //console.log(selectedKey)
  }

  // sync wallet with global blockchain state
  // during this process no keys should be created/deleted
  // i.e. no other function should call setKeyPairs during that time
  async function onSync()
  {
    let rpc = new JsonRpc(kylinTestnet.rpcEndpoints[0].protocol + "://" + kylinTestnet.rpcEndpoints[0].host + ":" + kylinTestnet.rpcEndpoints[0].port);
    // fetch global state of contract
    try
    {
      // EOS RAM ROW
      const gs = (await rpc.get_table_rows({
        code: "thezeostoken",
        scope: "thezeostoken",
        table: "globalstate",
        lower_bound: 1, // change to 0 if contract compiled with USE_VRAM set
        upper_bound: 1,  // change to 0 if contract compiled with USE_VRAM set
        json: true
      })).rows[0];
      console.log("global state: " + JSON.stringify(gs));
      
      
    }
    catch(e)
    {
      console.warn(e)
    }

    // walk through array of KeyPairs

        // compare with global state of each kp

        // fetch all new txs

        // walk through all new txs

            // add all notes to a pool (including nullifier and commitment fom WASM)
        
        // for each note in pool check if nullified and if so remove from pool

        // get mt indices for all remaining notes

        // sort notes into spendable notes array

        // save kp state in new array of KeyPairs
      
    // setKeyPairs to new array og kp states
  }

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
      <table>
        <thead><tr><th colSpan='2' align='left'>Parameter Files</th></tr></thead>
        <tbody>
          <tr><td align='right'>Mint Params:</td><td><input type='file' id='mint-params' /></td></tr>
          <tr><td align='right'>Transfer Params:</td><td><input type='file' id='transfer-params' /></td></tr>
          <tr><td align='right'>Burn Params:</td><td><input type='file' id='burn-params' /></td></tr>
          <tr><td><button onClick={()=>zeos_generate_mint_proof('wasm')}>Test Execute</button></td><td></td></tr>
        </tbody>
      </table>
      <br />
      <br />
      <button onClick={()=>onSync()}>Sync</button>
      <br />
      <br />
      <KeyManagement keyPairs={keyPairs} onCreateNewKey={onCreateNewKey} onKeySelect={onKeySelect} onDeleteKey={onDeleteKey} />
      <br />
      <br />
      <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
          <ZEOSWalletUAL keyPairs={keyPairs} selectedKey={selectedKey} rpc={new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)} />
      </UALProvider>
      <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
          <ZEOSWalletUAL keyPairs={keyPairs} selectedKey={selectedKey} rpc={new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)} />
      </UALProvider>
      <br />
      <Console logs={logs} variant="light" />
    </div>
  )
}

export default App