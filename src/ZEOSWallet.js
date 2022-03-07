import * as React from 'react'
import { createClient } from "@liquidapps/dapp-client";


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

function ZEOSWallet({ ual: { activeUser, activeAuthenticator, logout, showModal }, rpc })
{

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
      <div style={{ textAlign: 'center' }}>
        {activeUser ? renderTransferButton() : renderModalButton()}
        {!!activeUser && !!activeAuthenticator ? renderLogoutBtn() : <div></div>}
        {renderTreeButton()}
      </div>
    )
}

export default ZEOSWallet