import * as React from 'react'
import { base58_to_binary } from 'base58-js'

import Mint from './components/Mint'


const MintTransaction = {
  actions: [{
      account: 'thezeostoken',
      name: 'mint',
      authorization: [{
          actor: '', // use account that was logged in
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

  async function mint()
  {
    // TODO: check input parameters (including params file, ZEOS balance in logged in account)
    // TODO: add UAL Login(s) to state??
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
      // receive byte array containing mint params.
      // this byte array will be passed to RUST wasm
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

      // UAL sign json transaction
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

      // log response in window console
      // TODO
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
        {activeUser ? (!!activeUser && !!activeAuthenticator ? renderLogoutBtn() : <div></div>) : renderModalButton()}
        <Mint mint={mint} />
        <br />
      </div>
    )
}

export default ZEOSWallet