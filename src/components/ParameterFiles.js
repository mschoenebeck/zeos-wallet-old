import * as React from 'react'
import { useState, useEffect } from 'react'
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';
import { IconButton, Tooltip } from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';

function ParameterFiles()
{
  const [files, setFiles] = useState(["No file chosen", "No file chosen", "No file chosen"]);

  function onChange(e,i)
  {
    var val = document.getElementById(e+"-params").value;
    let newFiles = [...files];
    if('' === val) newFiles[i] = "No file chosen";
    else newFiles[i] = val.replace(/^C:\\fakepath\\/, "");
    setFiles(newFiles);
  }

  return (
    <div className='component' id='parameter-files'>
    <div className='header'><InputLabel>Parameter Files</InputLabel></div>
      <div className='column'>
        <div className='text-row'>
          <InputLabel htmlFor='mint-params'>
            <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">Mint Parameters</Button>
          </InputLabel>
          <Input type='file' id='mint-params' style={{ display: 'none' }} onChange={()=>onChange('mint',0)} />
          <InputLabel>{files[0]}</InputLabel>
          <Tooltip title=''>
            <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>onSave()}>Download</Button>
          </Tooltip>
        </div>
        <div className='text-row'>
          <InputLabel htmlFor='ztransfer-params'>
            <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">ZTransfer Parameters</Button>
          </InputLabel>
          <Input type='file' id='ztransfer-params' style={{ display: 'none' }} onChange={()=>onChange('ztransfer',1)} />
          <InputLabel>{files[1]}</InputLabel>
          <Tooltip title=''>
            <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>onSave()}>Download</Button>
          </Tooltip>
        </div>
        <div className='text-row'>
          <InputLabel htmlFor='burn-params'>
            <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">Burn Parameters</Button>
          </InputLabel>
          <Input type='file' id='burn-params' style={{ display: 'none' }} onChange={()=>onChange('burn',2)} />
          <InputLabel>{files[2]}</InputLabel>
          <Tooltip title='wau wau'>
            <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>onSave()}>Download</Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default ParameterFiles