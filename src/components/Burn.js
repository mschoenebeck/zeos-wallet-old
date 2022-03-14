import * as React from 'react'

function Burn({onBurn})
{
    return (
        <table>
        <thead><tr><th colSpan='2' align='left'>Burn</th></tr></thead>
        <tbody>
          <tr><td align='right'>Amount:</td><td><input defaultValue='0.0034' type='number' id='burn-amount-number' /><select id='burn-amount-select'><option value='ZEOS'>ZEOS</option></select></td></tr>
          <tr><td align='right'>To:</td><td><input type='text' id='burn-to' /></td></tr>
          <tr><td align='right'>Memo:</td><td><input type='text' id='burn-memo' /></td></tr>
          <tr><td></td><td><button onClick={()=>onBurn()}>Burn</button></td></tr>
        </tbody>
      </table>
    )
}

export default Burn