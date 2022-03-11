import * as React from 'react'
import { createClient } from "@liquidapps/dapp-client";
import { Asset } from '@greymass/eosio'
import { base58_to_binary } from 'base58-js'

import Mint from './components/Mint'


const demoTransaction = {
  actions: [{
      account: 'eosio.token',
      name: 'transfer',
      authorization: [{
          actor: '', // use account that was logged in
          permission: 'active',
      }],
      data: {
          from: '', // use account that was logged in
          to: 'newtraderst1',
          quantity: '1.0000 EOS',
          memo: 'UAL rocks!',
      },
  }],
}

function ZEOSWallet({ ual: { activeUser, activeAuthenticator, logout, showModal }, rpc, keyPairs, selectedKey })
{

  function mint()
  {
    var amt_str = document.getElementById("mint-amount-number").value
    var e = document.getElementById("mint-amount-select")
    var amt_sym = e.options[e.selectedIndex].text
    var qty = Asset.fromString(amt_str + ' ' + amt_sym)
    var addr = base58_to_binary(document.getElementById("mint-to").value.substring(1))
    var h_sk = addr.slice(0, 32)
    var pk = addr.slice(32, 64)
    var utf8Encode = new TextEncoder();
    var mm_ = utf8Encode.encode(document.getElementById("mint-memo").value) 
    var mm = new Array(32).fill(0); for(let i = 0; i < mm_.length; i++) { mm[i] = mm_[i]; }
    e = document.getElementById('mint-params');
    if(e.files.length === 0)
    {
      alert('No params file selected');
      return;
    }

    // check input parameters (including params file, ZEOS balance in logged in account)
    // TODO: add UAL Login(s) to state??
    
    
    //console.log(qty)
    //console.log(h_sk)
    //console.log(pk)
    //console.log(mm)
    //return
  
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
      }

      // create tx_r object
      var mint_tx_r = {
        notes: [
          {
            // TODO: why is symbol code 1397704026 and not 357812230660?
            quantity: { amount: qty.units.toNumber(), symbol: qty.symbol.code.value.toNumber() }, // Symbol(4, 'ZEOS').code = 357812230660
            rho: Array.from({length: 32}, () => Math.floor(Math.random() * 256))
          },
        ],
        memo: Array.from(mm)
      }
      
      // json = zeos_generate_mint_transaction(params, tx_obj)
      var json = await zeos_create_mint_transaction(mint_params, JSON.stringify(mint_addr), JSON.stringify(mint_tx_r));
      console.log(json)

      // decrypt right away using currently selectedKey
      var kp = keyPairs.find((s) => {return s.id == selectedKey})
      console.log(await zeos_decrypt_transaction(kp.sk, json))

      // UAL sign json transaction
      // TODO

      // log response in window console
      // TODO
    };
    fr.readAsArrayBuffer(e.files[0]);
  }

/*
  const updateTree = async () =>
  {
    try
    {
      // EOS RAM ROW
      const tree = await rpc.get_table_rows({
        code: "thezeostoken",
        index_position: "primary",
        json: true,
        key_type: "uint64_t",
        limit: 15,
        lower_bound: 0,
        reverse: false,
        scope: "thezeostoken",
        show_payer: false,
        table: "mteosram",
        table_key: "",
        upper_bound: 14
      })
      console.log("tree: " + JSON.stringify(tree))
      // DAPP VRAM ROW
      const client = await createClient({ network: "kylin", httpEndpoint: "http://kylin-dsp-1.liquidapps.io" })
      const service = await client.service('ipfs','thezeostoken')
      const response = await service.get_vram_row("thezeostoken", "thezeostoken", "verifierkey", "zeosmintnote")
      console.log("vk: " + JSON.stringify(response))
    }
    catch(e)
    {
      console.warn(e)
    }
  }

  const transfer = async () =>
  {
    try
    {
      demoTransaction.actions[0].authorization[0].actor = await activeUser.getAccountName()
      demoTransaction.actions[0].data.from = await activeUser.getAccountName()
      await activeUser.signTransaction(demoTransaction, { broadcast: true })
    }
    catch(error)
    {
      console.warn(error)
    }
  }
*/

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
/*
  const renderTransferButton = () =>
  {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button blue' onClick={transfer}>
          {'Transfer 1 eos to example'}
        </span>
      </p>
    )
  }

  const renderTreeButton = () =>
  {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button blue' onClick={updateTree}>
          {'update tree'}
        </span>
      </p>
    )
  }
*/
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