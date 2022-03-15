import * as React from 'react'

function TransactionInterface({id, isToZeosAddr, onExecute})
{

  function checkInputThenExecute()
  {
    // make sure the Amount is valid: number string must contain a dot and exactly 4 decimals
    // TODO: make this check dependent on 'id-amount-select'. for ZEOS it is 4 decimals. for pBTC it is 8 and so on...
    var amt_str = document.getElementById(id+'-amount-number').value;
    if(0 === amt_str.length)
    {
      alert("amount invalid: string must not be emty");
      return;
    }
    if(-1 === amt_str.indexOf('.') || 4 !== amt_str.substr(amt_str.indexOf('.')+1).length)
    {
      alert("amount invalid: number string must contain a dot and exactly 4 decimals");
      return;
    }

    // check the To field. this must either be a 12 letter EOS account name or a ZEOS address starting with a Z
    var addr_str = document.getElementById(id+'-to').value;
    if(0 === addr_str.length)
    {
      alert("to address invalid: string must not be emty");
      return;
    }
    if(isToZeosAddr)
    {
      if(90 !== addr_str.charCodeAt(0)) // must start with 'Z'
      {
        alert("to address invalid: ZEOS addresses always start with a capital 'Z'");
        return;
      }
      // TODO more checks
    }
    else // transparent EOS address (aka account name)
    {
      if(12 < addr_str.length)
      {
        alert("to address invalid: EOS account names are smaller or equal 12 characters");
        return;
      }
      for(let i = 0; i < addr_str.length; i++)
      {
        if( !((46 === addr_str.charCodeAt(i)) ||  // the dot '.'
              (49 <= addr_str.charCodeAt(i) && addr_str.charCodeAt(i) <= 53) || // 1-5
              (97 <= addr_str.charCodeAt(i) && addr_str.charCodeAt(i) <= 122))) // a-z
        {
          alert("to address invalid: EOS account names must contain characters from the base32 set: ., 1-5, a-z");
          return;
        }
      }
    }

    // execute the callback function
    onExecute();
  }

  return (
    <table>
    <thead><tr><th colSpan='2' align='left'>{id}</th></tr></thead>
    <tbody>
      <tr><td align='right'>Amount:</td><td><input defaultValue='0.0034' type='number' id={id+'-amount-number'} /><select id={id+'-amount-select'}><option value='ZEOS'>ZEOS</option></select></td></tr>
      <tr><td align='right'>To:</td><td><input type='text' id={id+'-to'} /></td></tr>
      <tr><td align='right'>Memo:</td><td><input type='text' id={id+'-memo'} /></td></tr>
      <tr><td></td><td><button onClick={()=>checkInputThenExecute()}>{id}</button></td></tr>
    </tbody>
  </table>
  )
}

export default TransactionInterface