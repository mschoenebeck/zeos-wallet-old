import * as React from 'react'
import { useState, useEffect } from 'react'

import { Ledger } from 'ual-ledger'
import { Lynx } from 'ual-lynx'
//import { Scatter } from 'ual-scatter'
import { Anchor } from 'ual-anchor'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'

import ZEOSWallet from './ZEOSWallet'
import KeyManagement from './components/KeyManagement'
import Mint from './components/Mint'

import { Console, Hook, Unhook } from 'console-feed'

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
  // set state variables
  const [keyPairs, setKeyPairs] = useState([]);
  const [selectedKey, setSelectedKey] = useState(-1);
  const [logs, setLogs] = useState([])

  // run once!
  useEffect(() => {
    Hook(
      window.console,
      (log) => setLogs((currLogs) => [...currLogs, log]),
      false
    )
    return () => Unhook(window.console)
  }, [])
  
  // reads a file selected by file input field 
  // source: https://stackoverflow.com/questions/32215538/using-filereader-readasarraybuffer-on-changed-files-in-firefox
  function readFile(id)
  {
    var input = document.getElementById(id);
  
    if(input.files.length === 0)
    {
      alert('No params file selected');
      return;
    }
  
    var fr = new FileReader();
    
    fr.onload = async function() {
      var data = fr.result;
      var array = new Uint8Array(data);
      //console.log(array);
      if(id == 'MintParams')
      {
        var sk = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31])

        var tx = {
          epk_s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
          sender: {
            change: {
              quantity: {
                amount: 100000,
                symbol: 357812230660
              },
              rho: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
            },
            esk_s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            esk_r: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            addr_r: {
              h_sk: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
              pk: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
            }
          },
          epk_r: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
          receiver: {
            notes: [{ quantity: { amount: 100000, symbol: 357812230660 }, rho: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] },
                    { quantity: { amount: 200000, symbol: 357812230660 }, rho: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] }],
            memo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
          }
        }
        //console.log(JSON.stringify(tx))
        //console.log(await zeos_generate_mint_transaction(array, sk, JSON.stringify(tx)))

        var enc_tx = {
          epk_s:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
          ciphertext_s:[
              [28,67,230,146,186,134,148,163,23,167,235,141,238,243,17,10],
              [38,30,244,53,74,207,26,226,210,216,239,101,101,72,44,198],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142]
          ],
          epk_r:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
          ciphertext_r:[
              [233,109,55,19,88,237,129,80,119,68,135,155,93,107,168,225],
              [182,154,189,105,108,83,158,50,146,103,197,217,73,77,32,172],
              [38,30,244,53,74,207,26,226,210,216,239,101,101,72,44,198],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [189,108,38,202,146,215,234,55,144,194,189,201,76,29,74,112],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142],
              [90,110,4,87,8,251,113,150,240,46,85,61,2,195,166,146],
              [233,195,239,138,178,52,83,230,240,116,156,214,54,231,168,142]
          ]
        }
        //console.log(JSON.stringify(enc_tx))
        //console.log(await zeos_decrypt_transaction(sk, JSON.stringify(enc_tx)))

        // create new random key pairs
        console.log(await zeos_create_key(Uint8Array.from({length: 32}, () => Math.floor(Math.random() * 256))))
      }
    };
    fr.readAsArrayBuffer(input.files[0]);
  }

  async function onCreateNewKey()
  {
    var seed = Uint8Array.from({length: 32}, () => Math.floor(Math.random() * 256))
    var kp = JSON.parse(await zeos_create_key(seed))
    kp.id  = keyPairs.length
    setKeyPairs([...keyPairs, kp])
    document.getElementById("key-select").value = kp.id
    setSelectedKey(kp.id)
    //console.log(selectedKey)
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

  function mint()
  {
    console.log(document.getElementById("mint-amount-number").value)
    console.log(document.getElementById("mint-amount-select").value)
    console.log(document.getElementById("mint-to").value)
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
          <tr><td align='right'>Mint Params:</td><td><input type='file' id='MintParams' /></td></tr>
          <tr><td align='right'>Transfer Params:</td><td><input type='file' id='TransferParams' /></td></tr>
          <tr><td align='right'>Burn Params:</td><td><input type='file' id='BurnParams' /></td></tr>
          <tr><td><button onClick={()=>zeos_generate_mint_proof('wasm')}>Test Execute</button></td><td><button onClick={()=>readFile('MintParams')}>Test ReadFile</button></td></tr>
        </tbody>
      </table>
      <br />
      <KeyManagement keyPairs={keyPairs} onCreateNewKey={onCreateNewKey} onKeySelect={onKeySelect} onDeleteKey={onDeleteKey} />
      <br />
      <Mint mint={mint} />
      <br />
      <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
          <ZEOSWalletUAL rpc={new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)} />
      </UALProvider>
      <UALProvider chains={[kylinTestnet]} authenticators={[ledger, lynx, /*scatter,*/ anchor]} appName={'My App'}>
          <ZEOSWalletUAL rpc={new JsonRpc(`${kylinTestnet.rpcEndpoints[0].protocol}://${kylinTestnet.rpcEndpoints[0].host}:${kylinTestnet.rpcEndpoints[0].port}`)} />
      </UALProvider>
      <br />
      <Console logs={logs} variant="light" />
    </div>
  )
}

export default App