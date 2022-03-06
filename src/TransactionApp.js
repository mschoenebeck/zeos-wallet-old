import * as React from 'react'
import { useState, useEffect } from 'react'
import { JsonRpc } from 'eosjs'

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

const kylinTestnet = {
  chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
  rpcEndpoints: [{
    protocol: "http",
    host: "kylin.eosn.io",
    port: 80,
  }]
}

const defaultState = {
  activeUser: null,
  accountName: '',
  accountBalance: null,
  rpc: new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)
}

function TransactionApp({ ual: { activeUser, activeAuthenticator, logout, showModal } })
{
  // see below
  //this.displayName = 'TransactionApp'

  const [st, setSt] = useState(defaultState)
  
  if(activeUser && !st.activeUser)
  {
    console.log("new login detected:");

    (async () => {
      try
      {
        const accountName = await activeUser.getAccountName()
        const account = await st.rpc.get_account(accountName)
        const accountBalance = account.core_liquid_balance
        setSt({activeUser: activeUser, accountName: accountName, accountBalance: accountBalance, rpc: st.rpc})
      }
      catch(e)
      {
        console.warn(e)
      }
    })()
  }
  else if(!activeUser && st.activeUser)
  {
    console.log("new logout detected: set default")
    setSt(defaultState)
  }
/*
  useEffect(() => 
  {
    console.log("useEffect called")
  })
*/
  const updateTree = async () =>
  {
    try
    {
      // EOS RAM ROW
      const tree = await st.rpc.get_table_rows({    
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
    const { accountName, activeUser } = st
    demoTransaction.actions[0].authorization[0].actor = accountName
    demoTransaction.actions[0].data.from = accountName
    try
    {
      await activeUser.signTransaction(demoTransaction, { broadcast: true })
      const account = await st.rpc.get_account(st.accountName)
      const accountBalance = account.core_liquid_balance
      setSt({activeUser: st.activeUser, accountName: st.accountName, accountBalance: accountBalance, rpc: st.rpc})
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
    if (!!activeUser && !!activeAuthenticator)
    {
      return (
        <p className='ual-btn-wrapper'>
          <span className='ual-generic-button red' onClick={logout}>
            {'Logout'}
          </span>
        </p>
      )
    }
  }

  const { accountBalance, accountName } = st
  const modalButton = !activeUser && renderModalButton()
  const loggedIn = '' !== accountName ? `Logged in as ${accountName}` : ''
  const myBalance = accountBalance ? `Balance: ${accountBalance}` : ''
  const transferBtn = accountBalance && renderTransferButton()
  return (
      <div style={{ textAlign: 'center' }}>
        {modalButton}
        <h3 className='ual-subtitle'>{loggedIn}</h3>
        <h4 className='ual-subtitle'>{myBalance}</h4>
        {transferBtn}
        {renderLogoutBtn()}
        {renderTreeButton()}
      </div>
    )
}

TransactionApp.displayName = 'TransactionApp'

export default TransactionApp