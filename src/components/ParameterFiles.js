import * as React from 'react'

function ParameterFiles()
{
    return (
      <table>
        <thead><tr><th colSpan='2' align='left'>Parameter Files</th></tr></thead>
        <tbody>
          <tr><td align='right'>Mint Params:</td><td><input type='file' id='mint-params' /></td></tr>
          <tr><td align='right'>Transfer Params:</td><td><input type='file' id='ztransfer-params' /></td></tr>
          <tr><td align='right'>Burn Params:</td><td><input type='file' id='burn-params' /></td></tr>
        </tbody>
      </table>
    )
}

export default ParameterFiles