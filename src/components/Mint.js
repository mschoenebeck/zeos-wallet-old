import * as React from 'react'

function Mint({onMint})
{
    return (
        <table>
        <thead><tr><th colSpan='2' align='left'>Mint</th></tr></thead>
        <tbody>
          <tr><td align='right'>Amount:</td><td><input defaultValue='0.0034' type='number' id='mint-amount-number' /><select id='mint-amount-select'><option value='ZEOS'>ZEOS</option></select></td></tr>
          <tr><td align='right'>To:</td><td><input type='text' id='mint-to' /></td></tr>
          <tr><td align='right'>Memo:</td><td><input type='text' id='mint-memo' /></td></tr>
          <tr><td></td><td><button onClick={()=>onMint()}>Mint</button></td></tr>
        </tbody>
      </table>
    )
}

export default Mint