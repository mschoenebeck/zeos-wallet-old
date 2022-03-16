import * as React from 'react'
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';

function WalletFile({onLoad, onSave})
{
    return (
      <div>
        <h3>Wallet File</h3>
          <p><InputLabel htmlFor='wallet-file'>Wallet:</InputLabel><Input type='file' id='wallet-file' /></p>
          <p><Button onClick={()=>onLoad()}>Load</Button><Button onClick={()=>onSave()}>Save</Button></p>
      </div>
    )
}

export default WalletFile