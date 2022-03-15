import * as React from 'react'

function TransactionInterface({id, onExecute})
{
    return (
        <table>
        <thead><tr><th colSpan='2' align='left'>{id}</th></tr></thead>
        <tbody>
          <tr><td align='right'>Amount:</td><td><input defaultValue='0.0034' type='number' id={id+'-amount-number'} /><select id={id+'-amount-select'}><option value='ZEOS'>ZEOS</option></select></td></tr>
          <tr><td align='right'>To:</td><td><input type='text' id={id+'-to'} /></td></tr>
          <tr><td align='right'>Memo:</td><td><input type='text' id={id+'-memo'} /></td></tr>
          <tr><td></td><td><button onClick={()=>onExecute()}>{id}</button></td></tr>
        </tbody>
      </table>
    )
}

export default TransactionInterface