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
import { saveAs } from 'file-saver';

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

  var rpc = new JsonRpc(kylinTestnet.rpcEndpoints[0].protocol + "://" + kylinTestnet.rpcEndpoints[0].host + ":" + kylinTestnet.rpcEndpoints[0].port);

  async function onCreateNewKey()
  {
    // can create randomness here in JS or in RUST by passing an empty seed
    //var seed = Array.from({length: 32}, () => Math.floor(Math.random() * 256))
    var kp = JSON.parse(await zeos_create_key([]))
    kp.id  = keyPairs.length
    kp.gs_tx_count = 0;
    kp.gs_mt_leaf_count = 0;
    kp.gs_mt_depth = 0;
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

  async function isNoteNullified(note)
  {
    // only first 4 bytes to match uint64_t table index
    let idx = parseInt(note.nullifier.substr(6, 2) + note.nullifier.substr(4, 2) + note.nullifier.substr(2, 2) + note.nullifier.substr(0, 2), 16)
    
    try
      {
        let json = await rpc.get_table_rows({
          code: "thezeostoken",
          scope: "thezeostoken",
          table: "nfeosram",
          lower_bound: idx, 
          upper_bound: idx,
          limit: 1,
          json: true
        });

        if(0 === json.rows.length)
          return false;

        return true;
      }
      catch(e) { console.warn(e); return; }
  }

  // sync wallet with global blockchain state
  // during this process no keys should be created/deleted
  // i.e. no other function should call setKeyPairs during that time
  async function onSync()
  {
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
      newKp.gs_mt_depth = gs.mt_depth;

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
            limit: 100,
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
        delete enc_tx.id;
        let dec_tx = JSON.parse(await zeos_decrypt_transaction(kp.sk, JSON.stringify(enc_tx)));
        console.log(dec_tx);
        
        // if sender part was successfull the 'change' note is new
        if(null !== dec_tx.sender)
        {
          let note = dec_tx.sender.change;
          // add nullifier and commitment
          note.commitment = (await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk));
          note.nullifier = (await zeos_note_nullifier(JSON.stringify(note), kp.sk));
          newNotes.push(note);
        }
        // if receiver is not null there are two cases:
        // 1. sender is null => collect notes
        // 2. sender is same key as receiver => collect notes
        if(null !== dec_tx.receiver && (dec_tx.sender === null || 
          dec_tx.sender.addr_r.pk.every(function(v, i) {return v === kp.addr.pk[i]})))
        {
          for(const n of dec_tx.receiver.notes)
          {
            let note = n;
            // add nullifier and commitment
            note.commitment = (await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk));
            note.nullifier = (await zeos_note_nullifier(JSON.stringify(note), kp.sk));
            newNotes.push(note);
          }
          // add tx to list
          dec_tx.id = enc_tx.id;
          newKp.transactions.push(dec_tx);
        }
      }
/*
      // for each note in pool check if nullified and if so remove from pool
      for(let i = newNotes.length-1; i >= 0; i--)
      {
        if(await isNoteNullified(newNotes[i]))
        {
          newNotes.splice(i, 1);
        }
        console.log(newNotes[i])
      }
*/

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

      // sort notes into spendable notes array
      for(const n of newNotes)
      {
        if(newKp.spendable_notes.length == 0 ||
          n.quantity.amount > newKp.spendable_notes[newKp.spendable_notes.length-1].quantity.amount)
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

      // for each note in spendable notes check if it was spent
      for(let i = newKp.spendable_notes.length-1; i >= 0; i--)
      {
        if(await isNoteNullified(newKp.spendable_notes[i]))
        {
          newKp.spendable_notes.splice(i, 1);
        }
      }

      newKp.gs_tx_count = gs.tx_count;
      newKp.gs_mt_leaf_count = gs.mt_leaf_count;

      // save kp state in array of new KeyPairs
      newKeyPairs.push(newKp);
    }
    setKeyPairs(newKeyPairs);
    console.log(newKeyPairs);
  }

  function getBalance()
  {
    if(-1 === selectedKey)
    {
      return 0;
    }

    let res = 0;
    for(const n of keyPairs[selectedKey].spendable_notes)
    {
      res += n.quantity.amount;
    }
    return res;
  }

  function onReadWalletFromFile()
  {
    let e = document.getElementById('wallet-file')
    if(e.files.length === 0)
    {
      alert('No wallet file selected')
      return
    }
  
    let reader = new FileReader();
    reader.readAsText(e.files[0]);
    reader.onload = function(){
      let wallet = JSON.parse(reader.result);
      setKeyPairs(wallet.keyPairs);
      setSelectedKey(wallet.selectedKey);
    };
  }

  function onWriteWalletToFile()
  {
    let file = new File([JSON.stringify({keyPairs: keyPairs, selectedKey: selectedKey})], "wallet.txt", {
      type: "text/plain;charset=utf-8",
    });
    saveAs(file, "wallet.txt");
  }

  async function nfTest(x)
  {
    try
      {
        let json = await rpc.get_table_rows({
          code: "thezeostoken",
          scope: "thezeostoken",
          table: "nfeosram",
          lower_bound: x,
          upper_bound: x,
          limit: 1,
          json: true
        });
//console.log(parseInt(note.nullifier.substr(0, 8), 16).toString(16))
console.log(json)
        if(0 === json.rows.length)
          return false;

        return true;
      }
      catch(e) { console.warn(e); return; }
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
          <tr><td align='right'>Transfer Params:</td><td><input type='file' id='ztransfer-params' /></td></tr>
          <tr><td align='right'>Burn Params:</td><td><input type='file' id='burn-params' /></td></tr>
          <tr><td align='right'>Wallet:</td><td><input type='file' id='wallet-file' /></td></tr>
          <tr><td></td><td><button onClick={()=>onReadWalletFromFile()}>Read</button><button onClick={()=>onWriteWalletToFile()}>Write</button></td></tr>
        </tbody>
      </table>
      <br />
      <br />
      <button onClick={()=>onSync()}>Sync</button>
      <button onClick={()=>nfTest(0xe8c97e36)}>Test Nullifier</button>
      <br />
      <br />
      <p>Current Balance: {getBalance()}</p>
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