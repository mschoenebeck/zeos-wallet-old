import * as React from 'react'
import { base58_to_binary } from 'base58-js'

import Mint from './components/Mint'
import ZTransfer from './components/ZTransfer'
import Burn from './components/Burn'

const MintTransaction = {
  actions: [{
      account: 'thezeostoken',
      name: 'mint',
      authorization: [{
          actor: '',
          permission: 'active',
      }],
      data: null,
  }],
}

const ZTransferTransaction = {
  actions: [{
      account: 'thezeostoken',
      name: 'ztransfer',
      authorization: [{
          actor: '',
          permission: 'active',
      }],
      data: null,
  }],
}

const BurnTransaction = {
  actions: [{
      account: 'thezeostoken',
      name: 'burn',
      authorization: [{
          actor: '',
          permission: 'active',
      }],
      data: null,
  }],
}

function ZEOSWallet({ ual: { activeUser, activeAuthenticator, logout, showModal }, rpc, keyPairs, selectedKey })
{

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
        MintTransaction.actions[0].authorization[0].actor = eos_user;
        MintTransaction.actions[0].data = JSON.parse(json);
        await activeUser.signTransaction(MintTransaction, { broadcast: true });
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
    for(const n of keyPairs[selectedKey].spendable_notes)
    {
      // since spendable_notes is sorted just choose the next bigger equal one
      if(n.quantity.amount >= qty.amt)
      {
        spent_note = n;
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
        ZTransferTransaction.actions[0].authorization[0].actor = eos_user;
        ZTransferTransaction.actions[0].data = JSON.parse(json);
        await activeUser.signTransaction(ZTransferTransaction, { broadcast: true });
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
    for(const n of keyPairs[selectedKey].spendable_notes)
    {
      // since spendable_notes is sorted just choose the next bigger equal one
      if(n.quantity.amount >= qty.amt)
      {
        spent_note = n;
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
        BurnTransaction.actions[0].authorization[0].actor = eos_user;
        BurnTransaction.actions[0].data = JSON.parse(json);
        await activeUser.signTransaction(BurnTransaction, { broadcast: true });
      }
      catch(error)
      {
        console.warn(error);
      }
    };
    fr.readAsArrayBuffer(e.files[0]);
  }

  const renderModalButton = () =>
  {
    return (
      <p className='ual-btn-wrapper'>
        <span
          role='button'
          onClick={showModal}
          className='ual-generic-button'>Show UAL Modal</span>
      </p>
    )
  }

  const renderLogoutBtn = () => 
  {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button red' onClick={logout}>
          {'Logout'}
        </span>
      </p>
    )
  }

  return (
      <div>
        <br />
        <button onClick={()=>getAuthPath(39)}>getMTNodeValue</button>
        {activeUser ? (!!activeUser && !!activeAuthenticator ? renderLogoutBtn() : <div></div>) : renderModalButton()}
        <Mint onMint={onMint} />
        <ZTransfer onZTransfer={onZTransfer} />
        <Burn onBurn={onBurn} />
        <br />
      </div>
    )
}

export default ZEOSWallet