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

  async function onCreateNewKey()
  {
    // can create randomness here in JS or in RUST by passing an empty seed
    //var seed = Array.from({length: 32}, () => Math.floor(Math.random() * 256))
    var kp = JSON.parse(await zeos_create_key([]))
    kp.id  = keyPairs.length
    kp.gs_tx_count = 0;
    kp.gs_mt_leaf_count = 0;
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
    
    try
    {
      // fetch global state of contract
      var gs = (await rpc.get_table_rows({
        code: "thezeostoken",
        scope: "thezeostoken",
        table: "globalstate",
        lower_bound: 1,         // change to 0 if contract compiled with USE_VRAM set
        upper_bound: 1,         // change to 0 if contract compiled with USE_VRAM set
        json: true
      })).rows[0];
    }
    catch(e) { console.warn(e); return; }
    console.log("global state:");
    console.log(gs);

    // walk through array of KeyPairs, update each one and store new state in newKeyPairs
    var newKeyPairs = [];
    for(const kp of keyPairs)
    {
      let newKp = kp;

      // check if there are new txs
      var new_txs = [];
      if(gs.tx_count > kp.gs_tx_count)
      {
        try
        {
          // fetch all new txs
          new_txs = (await rpc.get_table_rows({
            code: "thezeostoken",
            scope: "thezeostoken",
            table: "txdeosram",
            lower_bound: kp.gs_tx_count,
            upper_bound: gs.tx_count - 1,
            json: true
          })).rows;
        }
        catch(e) { console.warn(e); return; }
      }

      // loop through all new txs and collect new Notes
      var newNotes = [];
      for(const tx of new_txs)
      {
        // try to decrypt tx
        let enc_tx = tx;
        delete enc_tx.id
        let dec_tx = JSON.parse(await zeos_decrypt_transaction(kp.sk, JSON.stringify(enc_tx)));
        console.log(dec_tx);
        
        // if sender part was successfull the 'change' note is new
        if(null !== dec_tx.sender)
        {
          let note = dec_tx.sender.change;
          // add nullifier and commitment
          note.commitment = await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk);
          note.nullifier = await zeos_note_nullifier(JSON.stringify(note), kp.sk);
          newNotes.push(note);
          // add tx to list
          dec_tx.id = enc_tx.id;
          newKp.transactions.push(dec_tx);
        }
        // if receiver is not null there are two cases:
        // 1. sender is null => collect notes
        // 2. sender equals receiver => collect notes
        if(null !== dec_tx.receiver && (dec_tx.sender === null || 
          dec_tx.sender.addr_r.pk.every(function(v, i) {return v === kp.addr.pk[i]})))
        {
          for(const n of dec_tx.receiver.notes)
          {
            let note = n;
            // add nullifier and commitment
            note.commitment = await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk);
            note.nullifier = await zeos_note_nullifier(JSON.stringify(note), kp.sk);
            newNotes.push(note);
          }
          // add tx to list
          dec_tx.id = enc_tx.id;
          newKp.transactions.push(dec_tx);
        }
      }
      newKp.gs_tx_count = gs.tx_count;

      // for each note in pool check if nullified and if so remove from pool
      for(const n of newNotes)
      {
        // TODO
      }

      // set mt indices for all remaining notes
      for(let n of newNotes)
      {
        for(let i = kp.gs_mt_leaf_count; i < gs.mt_leaf_count; i++)
        {
          try
          {
            // calculate array index of leaf index i
            let idx = Math.floor(i/(1<<(gs.mt_depth))) * ((1<<((gs.mt_depth)+1)) - 1) + i%(1<<(gs.mt_depth)) + ((1<<(gs.mt_depth)) - 1);
            // fetch row containing that leaf
            let leaf = (await rpc.get_table_rows({
              code: "thezeostoken",
              scope: "thezeostoken",
              table: "mteosram",
              lower_bound: idx,
              upper_bound: idx,
              json: true
            })).rows;

            // compare with note's commitment val and if equal safe array index
            if(n.commitment == leaf[0].val)
            {
              n.mt_leaf_idx = i;
              n.mt_arr_idx = idx;
            }
          }
          catch(e) { console.warn(e); return; }
        }
      }
      newKp.gs_mt_leaf_count = gs.mt_leaf_count;

      // for each note in spendable notes check if it was spent
      // (only necessary if there was at least one tx with sender != null)
      // TODO

      // sort notes into spendable notes array
      for(const n of newNotes)
      {
        if(newKp.spendable_notes.length == 0 ||
          n.quantity.amount > newKp.spendable_notes[newKp.spendable_notes.length-1])
        {
          newKp.spendable_notes.push(n);
        }
        else
        {
          let i = 0;
          for(const m of newKp.spendable_notes)
          {
            if(n.quantity.amount <= m.quantity.amount)
            {
              newKp.spendable_notes.splice(i, 0, n);
              break;
            }
            i++;
          }
        }
      }

      // save kp state in array of new KeyPairs
      newKeyPairs.push(newKp);
    }
    setKeyPairs(newKeyPairs);
    console.log(newKeyPairs);
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
    </div>
  )
}

export default App