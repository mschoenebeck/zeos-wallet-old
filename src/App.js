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
import { base58_to_binary } from 'base58-js'

import KeyManagement from './components/KeyManagement'
import UALLogin from './components/UALLogin'
import Mint from './components/Mint'
import ZTransfer from './components/ZTransfer'
import Burn from './components/Burn'
import WalletFile from './components/WalletFile'
import ParameterFiles from './components/ParameterFiles'

const EOSTransaction = {
  actions: [{
      account: 'thezeostoken',
      name: '',
      authorization: [{
          actor: '',
          permission: 'active',
      }],
      data: null,
  }],
}

// NOTE: must have DSP node at the top (or actually only containing DSPs at all)
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
  // set state variables that define wallet state (i.e. those that will be stored in wallet file)
  const [keyPairs, setKeyPairs] = useState([]);
  const [selectedKey, setSelectedKey] = useState(-1);
  // status of UAL Logins (won't be saved to wallet file)
  const [activeUser, setActiveUser] = useState(null);
  const [activeZUser, setActiveZUser] = useState(null);
  const [username, setUsername] = useState("");
  const [zUsername, setZUsername] = useState("");
  const [zeosBalance, setZeosBalance] = useState(0);
  const [zZeosBalance, setZZeosBalance] = useState(0);
  // TODO: make array of RPC's and chose randomly for each request
  const [rpc, setRPC] = useState(new JsonRpc(kylinTestnet.rpcEndpoints[0].protocol + "://" + kylinTestnet.rpcEndpoints[0].host + ":" + kylinTestnet.rpcEndpoints[0].port));

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
    kp.spentNotes = [];
    kp.unspentNotes = [];
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

  // must have format: "123.1234 SYM"
  function parseAssetFromString(str)
  {
    let dot = str.indexOf(".")
    let space = str.indexOf(" ")

    let amt = parseInt(str.substring(0, space).replace(".", ""))
    let sym_str = str.substring(space)

    let decimals = space - dot - 1;
    let code = decimals;
    //for(var i = 0; i < sym_str.length; i++)
    //{
    //  code |= (sym_str.charCodeAt(i)) << (8*(1+i));
    //}
    code = code << 8;
    code = code + sym_str.charCodeAt(0);
    code = code << 8;
    code = code + sym_str.charCodeAt(1);
    code = code << 8;
    code = code + sym_str.charCodeAt(2);
    code = code << 8;
    code = code + sym_str.charCodeAt(3);

    return {
      amt: amt,
      sym_str: sym_str,
      sym_code: code,
      decimals: decimals 
    }
  }

  async function onMint()
  {
    // TODO: check input parameters (including params file, ZEOS balance in logged in account)
    var amt_str = document.getElementById("mint-amount-number").value
    var e = document.getElementById("mint-amount-select")
    var amt_sym = e.options[e.selectedIndex].text
    // TODO: parseAssetFromString gives wrong value
    var qty = parseAssetFromString(amt_str + ' ' + amt_sym)
    var addr = base58_to_binary(document.getElementById("mint-to").value.substring(1))
    var h_sk = addr.slice(0, 32)
    var pk = addr.slice(32, 64)
    var utf8Encode = new TextEncoder();
    var mm_ = utf8Encode.encode(document.getElementById("mint-memo").value) 
    var mm = new Array(32).fill(0); for(let i = 0; i < mm_.length; i++) { mm[i] = mm_[i]; }
    var eos_user = await activeUser.getAccountName()
    e = document.getElementById('mint-params')
    if(e.files.length === 0)
    {
      alert('No params file selected')
      return
    }
  
    // read Params file (actual execution below 'fr.onload' function definition)
    var fr = new FileReader();
    fr.onload = async function()
    {
      // receive byte array containing mint params from file
      var mint_params = new Uint8Array(fr.result);

      var mint_addr = {
        h_sk: Array.from(h_sk),
        pk: Array.from(pk)
      };

      // create tx_r object
      var mint_tx_r = {
        notes: [
          {
            // TODO: why is symbol code 1397704026 and not 357812230660?
            // TODO: parseAssetFromString gives wrong value
            quantity: { amount: qty.amt, symbol: 357812230660 }, // Symbol(4, 'ZEOS').code = 357812230660
            rho: Array.from({length: 32}, () => Math.floor(Math.random() * 256))
          },
        ],
        memo: Array.from(mm)
      };
      
      var json = await zeos_create_mint_transaction(mint_params, JSON.stringify(mint_addr), JSON.stringify(mint_tx_r), eos_user);
      console.log(json);

      // UAL sign EOS transaction json
      try
      {
        EOSTransaction.actions[0].name = 'mint';
        EOSTransaction.actions[0].data = JSON.parse(json);
        EOSTransaction.actions[0].authorization[0].actor = eos_user;
        await activeUser.signTransaction(EOSTransaction, { broadcast: true });
      }
      catch(error)
      {
        console.warn(error);
      }
    };
    fr.readAsArrayBuffer(e.files[0]);
  }

  async function getMTNodeValue(idx)
  {
    try
      {
        let json = await rpc.get_table_rows({
          code: "thezeostoken",
          scope: "thezeostoken",
          table: "mteosram",
          lower_bound: idx,
          upper_bound: idx,
          limit: 1,
          json: true
        });

        if(0 === json.rows.length)
          return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

        for (var bytes = [], c = 0; c < json.rows[0].val.length; c += 2)
          bytes.push(parseInt(json.rows[0].val.substr(c, 2), 16));

        return bytes;
      }
      catch(e) { console.warn(e); return; }
  }

  async function getAuthPath(arr_idx)
  {
    let auth_path_v = [];
    let auth_path_b = [];
    let tree_idx = Math.floor(arr_idx / ((1<<((keyPairs[selectedKey].gs_mt_depth)+1)) - 1));
    let tos = tree_idx * ((1<<((keyPairs[selectedKey].gs_mt_depth)+1)) - 1);
    for(let d = keyPairs[selectedKey].gs_mt_depth, idx = arr_idx - tos; d > 0; d--)
    {
      // if array index of node is uneven it is always the left child
      let is_left_child = (1 == idx % 2);
      // determine sister node
      let sis_idx = is_left_child ? idx + 1 : idx - 1;
      // get sister value
      let sis_val = await getMTNodeValue(tos + sis_idx);
      // add pair to array
      let sis = {val: sis_val, is_right: !is_left_child};
      auth_path_v.push(sis.val);
      auth_path_b.push(sis.is_right);
      // set idx to parent node index:
      // left child's array index divided by two (integer division) equals array index of parent node
      idx = is_left_child ? Math.floor(idx / 2) : Math.floor(sis_idx / 2);
    }
    let res = {auth_path_v: auth_path_v, auth_path_b: auth_path_b};
    //console.log(res);
    return res;
  }

  async function onZTransfer()
  {
    // TODO: check input parameters (including params file, ZEOS balance in logged in account)
    var amt_str = document.getElementById("ztransfer-amount-number").value
    var e = document.getElementById("ztransfer-amount-select")
    var amt_sym = e.options[e.selectedIndex].text
    // TODO: parseAssetFromString gives wrong value
    var qty = parseAssetFromString(amt_str + ' ' + amt_sym)
    var addr = base58_to_binary(document.getElementById("ztransfer-to").value.substring(1))
    var h_sk = addr.slice(0, 32)
    var pk = addr.slice(32, 64)
    var utf8Encode = new TextEncoder();
    var mm_ = utf8Encode.encode(document.getElementById("ztransfer-memo").value) 
    var mm = new Array(32).fill(0); for(let i = 0; i < mm_.length; i++) { mm[i] = mm_[i]; }
    var eos_user = await activeUser.getAccountName()
    e = document.getElementById('ztransfer-params')
    if(e.files.length === 0)
    {
      alert('No params file selected')
      return
    }

    // find note to transfer: choose the smallest necessary but not bigger than needed
    // TODO: later spent_note will become an array to allow for more than one note to spend at a time
    var spent_note = null;
    for(const n of keyPairs[selectedKey].unspentNotes)
    {
      // since unspentNotes is sorted just choose the next bigger equal one
      if(n.quantity.amount >= qty.amt)
      {
        // clone object here because of delete calls further below
        spent_note = structuredClone(n);
        break;
      }
    }
    if(null === spent_note)
    {
      console.log("Error: no note big enough available.")
      return;
    }

    // get merkle tree auth path of spent_note
    // TODO: later auth_path will become an array of auth paths to allow for more than one note to spend at a time
    var auth_pair = await getAuthPath(spent_note.mt_arr_idx);

    // read Params file (actual execution below 'fr.onload' function definition)
    var fr = new FileReader();
    fr.onload = async function()
    {
      // receive byte array containing ztransfer params from file
      var ztransfer_params = new Uint8Array(fr.result);

      // create tx object
      var ztransfer_tx_s = {
        change: {
          // TODO: why is symbol code 1397704026 and not 357812230660?
          // TODO: parseAssetFromString gives wrong value
          quantity: { amount: (spent_note.quantity.amount - qty.amt), symbol: 357812230660 }, // Symbol(4, 'ZEOS').code = 357812230660
          rho: Array.from({length: 32}, () => Math.floor(Math.random() * 256))
        },
        esk_s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        esk_r: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        addr_r: {
          h_sk: Array.from(h_sk),
          pk: Array.from(pk)
        }
      };

      var ztransfer_tx_r = {
        notes: [
          {
            // TODO: why is symbol code 1397704026 and not 357812230660?
            // TODO: parseAssetFromString gives wrong value
            quantity: { amount: qty.amt, symbol: 357812230660 }, // Symbol(4, 'ZEOS').code = 357812230660
            rho: Array.from({length: 32}, () => Math.floor(Math.random() * 256))
          },
        ],
        memo: Array.from(mm)
      };
      
      // remove some properties to match rustzeos' Note struct
      delete spent_note.commitment;
      delete spent_note.nullifier;
      delete spent_note.mt_leaf_idx;
      delete spent_note.mt_arr_idx;

      var json = await zeos_create_ztransfer_transaction(ztransfer_params,
                                                         keyPairs[selectedKey].sk,
                                                         JSON.stringify(ztransfer_tx_s),
                                                         JSON.stringify(ztransfer_tx_r),
                                                         JSON.stringify(spent_note),
                                                         JSON.stringify(auth_pair.auth_path_v),
                                                         JSON.stringify(auth_pair.auth_path_b));
      console.log(json);

      // UAL sign json transaction
      try
      {
        EOSTransaction.actions[0].name = 'ztransfer';
        EOSTransaction.actions[0].data = JSON.parse(json);
        EOSTransaction.actions[0].authorization[0].actor = eos_user;
        await activeZUser.signTransaction(EOSTransaction, { broadcast: true });
      }
      catch(error)
      {
        console.warn(error);
      }
    };
    fr.readAsArrayBuffer(e.files[0]);
  }

  async function onBurn()
  {
    // TODO: check input parameters (including params file, ZEOS balance in logged in account)
    var amt_str = document.getElementById("burn-amount-number").value
    var e = document.getElementById("burn-amount-select")
    var amt_sym = e.options[e.selectedIndex].text
    // TODO: parseAssetFromString gives wrong value
    var qty = parseAssetFromString(amt_str + ' ' + amt_sym)
    var eos_account = document.getElementById("burn-to").value
    var utf8Encode = new TextEncoder();
    var mm_ = utf8Encode.encode(document.getElementById("burn-memo").value) 
    var mm = new Array(32).fill(0); for(let i = 0; i < mm_.length; i++) { mm[i] = mm_[i]; }
    var eos_user = await activeUser.getAccountName()
    e = document.getElementById('burn-params')
    if(e.files.length === 0)
    {
      alert('No params file selected')
      return
    }

    // find note to transfer: choose the smallest necessary but not bigger than needed
    // TODO: later spent_note will become an array to allow for more than one note to spend at a time
    var spent_note = null;
    for(const n of keyPairs[selectedKey].unspentNotes)
    {
      // since unspentNotes is sorted just choose the next bigger equal one
      if(n.quantity.amount >= qty.amt)
      {
        // clone object here because of delete calls further below
        spent_note = structuredClone(n);
        break;
      }
    }
    if(null === spent_note)
    {
      console.log("Error: no note big enough available.")
      return;
    }

    // get merkle tree auth path of spent_note
    // TODO: later auth_path will become an array of auth paths to allow for more than one note to spend at a time
    var auth_pair = await getAuthPath(spent_note.mt_arr_idx);

    // read Params file (actual execution below 'fr.onload' function definition)
    var fr = new FileReader();
    fr.onload = async function()
    {
      // receive byte array containing ztransfer params from file
      var burn_params = new Uint8Array(fr.result);

      // create tx object
      var burn_tx_s = {
        change: {
          // TODO: why is symbol code 1397704026 and not 357812230660?
          // TODO: parseAssetFromString gives wrong value
          quantity: { amount: (spent_note.quantity.amount - qty.amt), symbol: 357812230660 }, // Symbol(4, 'ZEOS').code = 357812230660
          rho: Array.from({length: 32}, () => Math.floor(Math.random() * 256))
        },
        esk_s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        esk_r: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        addr_r: {
          h_sk: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          pk: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        }
      };

      // TODO: why is symbol code 1397704026 and not 357812230660?
      // TODO: parseAssetFromString gives wrong value
      var quantity = { amount: qty.amt, symbol: 357812230660 }
      
      // remove some properties to match rustzeos' Note struct
      delete spent_note.commitment;
      delete spent_note.nullifier;
      delete spent_note.mt_leaf_idx;
      delete spent_note.mt_arr_idx;

      var json = await zeos_create_burn_transaction(burn_params,
                                                    keyPairs[selectedKey].sk,
                                                    JSON.stringify(burn_tx_s),
                                                    JSON.stringify(quantity),
                                                    JSON.stringify(spent_note),
                                                    JSON.stringify(auth_pair.auth_path_v),
                                                    JSON.stringify(auth_pair.auth_path_b),
                                                    eos_account);
      console.log(json);

      // UAL sign json transaction
      try
      {
        EOSTransaction.actions[0].name = 'burn';
        EOSTransaction.actions[0].data = JSON.parse(json);
        EOSTransaction.actions[0].authorization[0].actor = eos_user;
        await activeUser.signTransaction(EOSTransaction, { broadcast: true });
      }
      catch(error)
      {
        console.warn(error);
      }
    };
    fr.readAsArrayBuffer(e.files[0]);
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

  async function getZeosAccountBalance(eosAccountName)
  {
    try
      {
        let json = await rpc.get_table_rows({
          code: "thezeostoken",
          scope: eosAccountName,
          table: "accounts",
          lower_bound: 1397704026, // 1397704026 why this one (without decimals)
          upper_bound: 1397704026, // 357812230660 and not this one?
          limit: 1,
          json: true
        });

        if(0 === json.rows.length)
          return 0;

        return json.rows[0].balance;
      }
      catch(e) { console.warn(e); return; }
  }

  function getZeosWalletBalance()
  {
    if(-1 === selectedKey)
    {
      return 0;
    }

    let res = 0;
    for(const n of keyPairs[selectedKey].unspentNotes)
    {
      res += n.quantity.amount;
    }
    return res;
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
    console.log("global stats:");
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
        catch(e) { console.warn(e); continue; }
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
        if(dec_tx.sender)
        {
          let note = dec_tx.sender.change;
          // get nullifier and commitment
          note.commitment = await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk);
          note.nullifier = await zeos_note_nullifier(JSON.stringify(note), kp.sk);
          newNotes.push(note);
        }
        // if receiver is not null there are two cases:
        // 1. sender is null => collect notes
        // 2. sender is same key as receiver => collect notes
        if(dec_tx.receiver && (!dec_tx.sender || 
          dec_tx.sender.addr_r.pk.every(function(v, i) {return v === kp.addr.pk[i]})))
        {
          for(const n of dec_tx.receiver.notes)
          {
            let note = n;
            // get nullifier and commitment
            note.commitment = await zeos_note_commitment(JSON.stringify(note), kp.addr.h_sk);
            note.nullifier = await zeos_note_nullifier(JSON.stringify(note), kp.sk);
            newNotes.push(note);
          }
          // add tx to list
          dec_tx.id = tx.id;
          newKp.transactions.push(dec_tx);
        }
      }

      // set mt indices for all new notes if there are new notes
      if(newNotes.length > 0)
      {
        for(let i = kp.gs_mt_leaf_count; i < gs.mt_leaf_count; i++)
        {
          // calculate array index idx of leaf index i
          let idx = Math.floor(i/(1<<(gs.mt_depth))) * ((1<<((gs.mt_depth)+1)) - 1) + i%(1<<(gs.mt_depth)) + ((1<<(gs.mt_depth)) - 1);
          let leaf = null;
          try
          {
            // fetch row containing that leaf
            leaf = (await rpc.get_table_rows({
              code: "thezeostoken",
              scope: "thezeostoken",
              table: "mteosram",
              lower_bound: idx,
              upper_bound: idx,
              json: true
            })).rows;
          }
          catch(e) { console.warn(e); return; }

          for(let n of newNotes)
          {
            // compare with note's commitment val and if equal safe array index
            if(leaf.length > 0 && n.commitment == leaf[0].val)
            {
              n.mt_leaf_idx = i;
              n.mt_arr_idx = idx;
            }
          }
        }
      }

      // sort new notes into unspent notes array of this key pair
      for(const n of newNotes)
      {
        if(newKp.unspentNotes.length == 0 ||
          n.quantity.amount > newKp.unspentNotes[newKp.unspentNotes.length-1].quantity.amount)
        {
          newKp.unspentNotes.push(n);
        }
        else
        {
          let i = 0;
          for(const m of newKp.unspentNotes)
          {
            if(n.quantity.amount <= m.quantity.amount)
            {
              newKp.unspentNotes.splice(i, 0, n);
              break;
            }
            i++;
          }
        }
      }

      // for each note in unspent notes check if it was spent
      for(let i = newKp.unspentNotes.length-1; i >= 0; i--)
      {
        if(await isNoteNullified(newKp.unspentNotes[i]))
        {
          newKp.spentNotes.push(...newKp.unspentNotes.splice(i, 1));
        }
      }

      // update stats
      newKp.gs_tx_count = gs.tx_count;
      newKp.gs_mt_leaf_count = gs.mt_leaf_count;

      // save kp state in array of new KeyPairs
      newKeyPairs.push(newKp);
    }
    setKeyPairs(newKeyPairs);
    console.log(newKeyPairs);
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
    reader.onload = function() {
      let wallet = JSON.parse(reader.result);
      setKeyPairs(wallet.keyPairs);
      setSelectedKey(wallet.selectedKey);
    };
  }

  function onWriteWalletToFile()
  {
    let file = new File([JSON.stringify({keyPairs: keyPairs, selectedKey: selectedKey})], "wallet.zeos", {
      type: "text/plain;charset=utf-8",
    });
    saveAs(file, "wallet.zeos");
  }

  async function onUserChange(user)
  {
    setActiveUser(user);
    if(user)
    {
      let username = await user.getAccountName();
      setUsername(username);
      setZeosBalance(await getZeosAccountBalance(username));
    }
    else
    {
      setUsername("");
      setZeosBalance(0);
    }
  }

  async function onZUserChange(user)
  {
    setActiveZUser(user);
    if(user)
    {
      let username = await user.getAccountName();
      setZUsername(username);
      setZZeosBalance(await getZeosAccountBalance(username));
    }
    else
    {
      setZUsername("");
      setZZeosBalance(0);
    }
  }

  UALLogin.displayName = 'UALLogin'
  const UALLoginUAL = withUAL(UALLogin)
  UALLogin.displayName = 'UALLoginUAL'

  const appName = 'My App'
  const lynx = new Lynx([kylinTestnet])
  const ledger = new Ledger([kylinTestnet])
  const anchor = new Anchor([kylinTestnet], { appName })
  
  return (
    <div>
      <WalletFile onLoad={onReadWalletFromFile} onSave={onWriteWalletToFile} />
      <ParameterFiles />
      <br />
      <br />
      <button onClick={()=>onSync()}>Sync</button>
      <br />
      <br />
      <KeyManagement keyPairs={keyPairs} onCreateNewKey={onCreateNewKey} onKeySelect={onKeySelect} onDeleteKey={onDeleteKey} zeosBalance={getZeosWalletBalance()} />
      <br />
      <div>
        <div>{activeUser ? username :  <div></div>}</div>
        <div>{activeUser ? zeosBalance :  <div></div>}</div>
        <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, anchor]} appName={'My App'}>
          <UALLoginUAL appActiveUser={activeUser} onChange={onUserChange} />
        </UALProvider>
        <Mint onMint={onMint} />
        <Burn onBurn={onBurn} />
      </div>
      <div>
        <div>{activeZUser ? zUsername :  <div></div>}</div>
        <div>{activeZUser ? zZeosBalance :  <div></div>}</div>
        <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, anchor]} appName={'My App'}>
          <UALLoginUAL appActiveUser={activeZUser} onChange={onZUserChange} />
        </UALProvider>
        <ZTransfer onZTransfer={onZTransfer} />
      </div>
      <br />
    </div>
  )
}

export default App