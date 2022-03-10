import * as React from 'react'
import { binary_to_base58 } from 'base58-js'
//import { base58_to_binary } from 'base58-js' // USAGE: const bin = base58_to_binary('6MRy'); console.log(bin);

function KeyManagement({keyPairs, onCreateNewKey, onKeySelect, onDeleteKey})
{
    function copyToClipboard()
    {
        var e = document.getElementById("key-select");
        var addr = e.options[e.selectedIndex].text;
        navigator.clipboard.writeText(addr).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy address: ', err);
        });
    }

    return (
        <table>
        <thead><tr><th colSpan='4' align='left'>Key Management</th></tr></thead>
        <tbody>
          <tr>
            <td colSpan='4'>
              <label htmlFor='key-select'>Addresses:</label>
              <select name='keys' id='key-select' onChange={()=>onKeySelect()}>
                {keyPairs.slice(0).reverse().map((kp)=>{return(<option key={kp.id} value={kp.id}>Z{binary_to_base58(kp.addr.h_sk.concat(kp.addr.pk))}</option>)})}
              </select>
            </td>
            <td>Balances:</td>
          </tr>
          <tr>
            <td><button onClick={()=>onCreateNewKey()}>New Key</button></td>
            <td><button onClick={()=>copyToClipboard()}>Copy Address</button></td>
            <td><button onClick={()=>onDeleteKey()}>Delete Key</button></td>
            <td><button onClick={()=>onShowKey()}>Show Key</button></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    )
}

export default KeyManagement