import * as React from 'react'
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';

function ParameterFiles()
{
    return (
      <div>
        <h3 align='left'>Parameter Files</h3>
          <p><InputLabel htmlFor='mint-params'>Mint Params:</InputLabel><Input type='file' id='mint-params' /></p>
          <p><InputLabel htmlFor='mint-params'>Transfer Params:</InputLabel><Input type='file' id='ztransfer-params' /></p>
          <p><InputLabel htmlFor='mint-params'>Burn Params:</InputLabel><Input type='file' id='burn-params' /></p>
      </div>
    )
}

export default ParameterFiles