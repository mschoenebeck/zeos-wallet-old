import * as React from 'react'
import { useState, useEffect } from 'react'
import { binary_to_base58 } from 'base58-js'

import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';

function KeyManagement({keyPairs, selectedKey, onCreateNewKey, onKeySelect, onDeleteKey, onImportKey, zeosBalance})
{
  const [viewSK, setViewSK] = useState(false);

  function copyAddrToClipboard()
  {
      if(-1 === selectedKey)
      {
        console.log('Error: No address selected');
        return;
      }
      var addr = 'Z' + binary_to_base58(keyPairs[selectedKey].addr.h_sk.concat(keyPairs[selectedKey].addr.pk));
      navigator.clipboard.writeText(addr).then(function() {
          console.log('copied address to clipboard!');
      }, function(err) {
          console.error('Error: Could not copy address: ', err);
      });
  }

  function copySkToClipboard()
  {
      if(-1 === selectedKey)
      {
        console.log('Error: No Key selected');
        return;
      }
      var addr = 'S' + binary_to_base58(keyPairs[selectedKey].sk);
      navigator.clipboard.writeText(addr).then(function() {
          console.log('copied secret key to clipboard!');
      }, function(err) {
          console.error('Error: Could not copy secret key: ', err);
      });
  }

  function onViewSecretKey()
  {
    setViewSK(true);
  };
  
  function onCloseViewSecretKey()
  {
    setViewSK(false);
  };
  
  function onCloseViewSecretKeyAndCopy()
  {
    copySkToClipboard();
    setViewSK(false);
  };

  return (
    <div>
      <h3 align='left'>Key Management</h3>
      <p>
        <InputLabel htmlFor='key-input'>Secret Key: </InputLabel>
        <Input id='key-input' />
        <Button onClick={()=>onImportKey()}>Import</Button>
      </p>
      <p>
        <InputLabel htmlFor='key-select'>Addresses: </InputLabel>
        <Select id='key-select' value={selectedKey} onChange={()=>onKeySelect()}>
          {-1 === selectedKey ?
          <MenuItem value={-1}><em>None</em></MenuItem> :
          keyPairs.slice(0).reverse().map((kp)=>{return(<MenuItem key={kp.id} value={kp.id}>Z{binary_to_base58(kp.addr.h_sk.concat(kp.addr.pk))}</MenuItem>)})}
        </Select>
      </p>
      <p>
          <Button onClick={()=>onCreateNewKey()}>New Key</Button>
          <Button onClick={()=>copyAddrToClipboard()}>Copy Address</Button>
          <Button onClick={()=>onDeleteKey()}>Delete Key</Button>
          <Button color="primary" onClick={onViewSecretKey}>View Secret Key</Button>
          <Dialog open={viewSK} onClose={onCloseViewSecretKey}>
            <DialogTitle>Secret Key</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {-1 === selectedKey ? 'No Key selected' : 'S' + binary_to_base58(keyPairs[selectedKey].sk)}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCloseViewSecretKey} color="primary">Close</Button>
              <Button onClick={onCloseViewSecretKeyAndCopy} color="primary" autoFocus>Copy To Clipboard</Button>
            </DialogActions>
          </Dialog>
      </p>
      <p>
        <InputLabel>ZEOS Balance: {zeosBalance}</InputLabel>
      </p>
    </div>
  )
}

export default KeyManagement