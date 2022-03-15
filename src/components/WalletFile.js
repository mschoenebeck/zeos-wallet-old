import * as React from 'react'

function WalletFile({onLoad, onSave})
{
    return (
      <table>
        <thead><tr><th colSpan='2' align='left'>Wallet File</th></tr></thead>
        <tbody>
          <tr><td align='right'>Wallet:</td><td><input type='file' id='wallet-file' /></td></tr>
          <tr><td></td><td><button onClick={()=>onLoad()}>Load</button><button onClick={()=>onSave()}>Save</button></td></tr>
        </tbody>
      </table>
    )
}

export default WalletFile