import * as React from 'react'

function ZTransfer({onZTransfer})
{
    return (
        <table>
        <thead><tr><th colSpan='2' align='left'>zTransfer</th></tr></thead>
        <tbody>
          <tr><td align='right'>Amount:</td><td><input defaultValue='0.0034' type='number' id='ztransfer-amount-number' /><select id='ztransfer-amount-select'><option value='ZEOS'>ZEOS</option></select></td></tr>
          <tr><td align='right'>To:</td><td><input type='text' id='ztransfer-to' /></td></tr>
          <tr><td align='right'>Memo:</td><td><input type='text' id='ztransfer-memo' /></td></tr>
          <tr><td></td><td><button onClick={()=>onZTransfer()}>ztransfer</button></td></tr>
        </tbody>
      </table>
    )
}

export default ZTransfer