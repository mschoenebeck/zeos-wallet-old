import * as React from 'react'
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import SyncIcon from '@material-ui/icons/Sync';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import SettingsApplicationsIcon from '@material-ui/icons/SettingsApplications';
import { IconButton } from '@material-ui/core';

function GlobalStats({keyPairs, selectedKey, onSync})
{
    return (
      <div className='component' id='global-stats'>
      <div className='header'><InputLabel>Global Data (on chain)</InputLabel></div>
        <div className='column'>
          <div className='text-row'>
          <IconButton onClick={()=>alert('Wallet Files')}><AccountBalanceWalletIcon /></IconButton>
            <IconButton onClick={()=>alert('Parameter Files')}><SettingsApplicationsIcon /></IconButton>
            <IconButton onClick={()=>onSync()}><SyncIcon /></IconButton>
            <InputLabel>TX Count: {-1 === selectedKey ? '0' : keyPairs[selectedKey].gs_tx_count}</InputLabel>
            <InputLabel>Leaf Count: {-1 === selectedKey ? '0' : keyPairs[selectedKey].gs_mt_leaf_count}</InputLabel>
          </div>
        </div>
      </div>
    )
}

export default GlobalStats