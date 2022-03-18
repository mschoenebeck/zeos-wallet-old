import * as React from 'react';
import { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { IconButton, Tooltip } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import ArchiveIcon from '@material-ui/icons/Archive';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';
import GetAppIcon from '@material-ui/icons/GetApp';
import SettingsApplicationsIcon from '@material-ui/icons/SettingsApplications';
import SyncIcon from '@material-ui/icons/Sync';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';

export default function Header({keyPairs, selectedKey, onSync, onLoadWallet, onSaveWallet})
{
  const [anchorEl, setAnchorEl] = useState(null);
  const [files, setFiles] = useState(["No file chosen", "No file chosen", "No file chosen"]);

  function onChangeFile(e,i)
  {
    var val = document.getElementById(e+"-params").value;
    let newFiles = [...files];
    if('' === val) newFiles[i] = "No file chosen";
    else newFiles[i] = val.replace(/^C:\\fakepath\\/, "");
    setFiles(newFiles);
  }
  function onChangeWallet()
  {
    if('' !== document.getElementById("wallet-file").value)
    {
      onLoadWallet();
      document.getElementById("wallet-file").value = "";
    }
  }
  function handleClick(event)
  {
    setAnchorEl(event.currentTarget);
  }
  function handleClose()
  {
    setAnchorEl(null);
  };

  return (
    <div>
      <div className='text-row'>
        <Button
          id="demo-customized-button"
          aria-controls={anchorEl ? 'demo-customized-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={anchorEl ? 'true' : undefined}
          variant="contained"
          disableElevation
          onClick={handleClick}
          startIcon={<SettingsApplicationsIcon />}
          endIcon={<KeyboardArrowDownIcon />}
        >
          Parameters
        </Button>
        <Input type='file' id='mint-params' style={{ display: 'none' }} onChange={()=>onChangeFile('mint', 0)} />
        <Input type='file' id='ztransfer-params' style={{ display: 'none' }} onChange={()=>onChangeFile('ztransfer', 1)} />
        <Input type='file' id='burn-params' style={{ display: 'none' }} onChange={()=>onChangeFile('burn', 2)} />
        <Menu
          id="demo-customized-menu"
          MenuListProps={{
            'aria-labelledby': 'demo-customized-button',
          }}
          anchorEl={anchorEl}
          open={null !== anchorEl}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose} disableRipple>
            <div className='column'>
            <div className='text-row'>
            <InputLabel htmlFor='mint-params'>
              <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">Mint Parameters</Button>
            </InputLabel>
            <InputLabel>{files[0]}</InputLabel>
            </div>
            <div className='text-row'>
            <Tooltip title=''>
              <Button variant='contained' onClick={()=>{window.open('mint.params')}} startIcon={<GetAppIcon />}>Download</Button>
            </Tooltip>
            </div>
            </div>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleClose} disableRipple>
            <div className='column'>
            <div className='text-row'>
            <InputLabel htmlFor='ztransfer-params'>
              <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">ZTransfer Parameters</Button>
            </InputLabel>
            <InputLabel>{files[1]}</InputLabel>
            </div>
            <div className='text-row'>
            <Tooltip title=''>
              <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>{window.open('ztransfer.params')}}>Download</Button>
            </Tooltip>
            </div>
            </div>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleClose} disableRipple>
            <div className='column'>
            <div className='text-row'>
            <InputLabel htmlFor='burn-params'>
              <Button variant='contained' startIcon={<OpenInBrowserIcon />} component="span">Burn Parameters</Button>
            </InputLabel>
            <InputLabel>{files[2]}</InputLabel>
            </div>
            <div className='text-row'>
            <Tooltip title='wau wau'>
              <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>{window.open('burn.params')}}>Download</Button>
            </Tooltip>
            </div>
            </div>
          </MenuItem>
        </Menu>
        <InputLabel htmlFor='wallet-file' style={{display: "flex", alignItems: "baseline"}}>
          <Button variant='contained' startIcon={<AccountBalanceWalletIcon />} component="span">Wallet</Button>
        </InputLabel>
        <Input type='file' id='wallet-file' style={{ display: 'none' }} onChange={()=>onChangeWallet()} />
        <Button variant='contained' startIcon={<GetAppIcon />} onClick={()=>onSaveWallet()}>Save</Button>
        <Button variant='contained' startIcon={<SyncIcon />} onClick={()=>onSync()}>Sync</Button>
        <InputLabel>TX Count: {(-1 === selectedKey || selectedKey >= keyPairs.length) ? '0' : keyPairs[selectedKey].gs_tx_count}</InputLabel>
        <InputLabel>Leaf Count: {(-1 === selectedKey || selectedKey >= keyPairs.length) ? '0' : keyPairs[selectedKey].gs_mt_leaf_count}</InputLabel>
      </div>
    </div>
  );
}
