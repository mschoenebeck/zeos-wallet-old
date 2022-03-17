import * as React from 'react'
import { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';
import GetAppIcon from '@material-ui/icons/GetApp';

function WalletFile({onLoad, onSave})
{
  const [file, setFile] = useState("No file chosen");

  function onChange()
  {
    let val = document.getElementById("wallet-file").value;

    if('' === val)
    {
      setFile("No file chosen");
    }
    else
    {
      setFile(val.replace(/^C:\\fakepath\\/, ""));
      onLoad();
    }
  }

  return (
    <div className='component' id='wallet-files'>
      <div className='header'><InputLabel>Wallet Files</InputLabel></div>
      <div className='column'>
        <div className='text-row'>
          <InputLabel htmlFor='wallet-file'>
            <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">Load Wallet</Button>
          </InputLabel>
          <Input type='file' id='wallet-file' style={{ display: 'none' }} onChange={()=>onChange()} />
          <InputLabel>{file}</InputLabel>
          <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>onSave()}>Save Wallet</Button>
        </div>
      </div>
    </div>
  )
}

export default WalletFile