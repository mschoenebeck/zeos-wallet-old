import * as React from 'react';
import { useState, useEffect } from 'react'
import { binary_to_base58 } from 'base58-js'

import InputLabel from '@material-ui/core/InputLabel';
//import MoneyIcon from '@material-ui/icons/Money';
import LocalAtmIcon from '@material-ui/icons/LocalAtm';
//import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

function asset2Str(quantity)
{
    let decimals = quantity.symbol & 0xFF;
    let sym_str = "";
    for(let v = quantity.symbol/2**8; v > 1; v /= 2**8)
    {
        sym_str += String.fromCharCode(v & 0xFF);
    }
    return quantity.amount/10**decimals + ' ' + sym_str;
}

function bytes2U64(bytes)
{
    var value = 0;
    for(var i = 0; i < bytes.length; i++)
    {
        value += bytes[i]*2**(i*8);
    }
    return value;
  }

export default function TransactionHistory({keyPairs, selectedKey})
{
    function Note({n})
    {
        // TODO: remove warning by adding key to list elements
        // key={parseInt(n.commitment.substr(0, 8), 16)}
        return (
          <InputLabel>
            <div className='note'>
              <LocalAtmIcon />
              <div className='note-quantity'>{asset2Str(n.quantity)}</div>
            </div>
          </InputLabel>
        );
    }

    function MintTransaction({tx})
    {
        let username = String.fromCharCode(...tx.epk_s.slice(0, 16).filter((b)=>{return b !== 0}));
        let amt = bytes2U64(tx.epk_s.slice(16, 24));
        let sym = bytes2U64(tx.epk_s.slice(24, 32));
        let qty = {amount: amt, symbol: sym};
        let memo = String.fromCharCode(...tx.receiver.memo.filter((b)=>{return b !== 0}));

        // TODO: remove warning by adding key to list elements
        // key={tx.id}
        return (
            <InputLabel>
              <div className='text-row'>
                <div>{tx.id}</div>
                <AddIcon style={{ fontSize: 18 }} />
                <div>Mint '{asset2Str(qty)}' from account '{username}'</div>
                <div>Memo: '{memo}'</div>
              </div>
            </InputLabel>
        )
    }

    function ZTransferTransaction({tx})
    {
        let addr = "Z" + binary_to_base58(tx.sender.addr_r.h_sk.concat(tx.sender.addr_r.pk));
        let amt = 0;
        for(const n of tx.receiver.notes)
        {
            amt += n.quantity.amount;
        }
        let qty = {amount: amt, symbol: tx.receiver.notes[0].quantity.symbol};
        let memo = String.fromCharCode(...tx.receiver.memo.filter((b)=>{return b !== 0}));

        // TODO: remove warning by adding key to list elements
        // key={tx.id}
        return (
            <InputLabel>
              <div className='text-row'>
                <div>{tx.id}</div>
                <DoubleArrowIcon style={{ fontSize: 18 }} />
                <div>Transfer '{asset2Str(qty)}' to address '{addr}'</div>
                <div>Memo: '{memo}'</div>
              </div>
            </InputLabel>
        )
    }

    function BurnTransaction({tx})
    {
        let username = String.fromCharCode(...tx.epk_r.slice(0, 16).filter((b)=>{return b !== 0}));
        let amt = bytes2U64(tx.epk_r.slice(16, 24));
        let sym = bytes2U64(tx.epk_r.slice(24, 32));
        let qty = {amount: amt, symbol: sym};

        // TODO: remove warning by adding key to list elements
        // key={tx.id}
        return (
            <InputLabel>
              <div className='text-row'>
                <div>{tx.id}</div>
                <RemoveIcon style={{ fontSize: 18 }} />
                <div>Burn '{asset2Str(qty)}' to account '{username}'</div>
              </div>
            </InputLabel>
        )
    }

    // TODO only output Unspent Notes and Spent Notes if they contain elements so far only keyPairs[selectedKey].transactions.length is checked for all
    return (
        <div>
            {(-1 === selectedKey || selectedKey >= keyPairs.length || 0 === keyPairs[selectedKey].transactions.length) ? <></> :
            <div className='column'>
                <div className='row'>
                <div className='component note-row'>
                    <div className='header'><InputLabel>Unspent Notes</InputLabel></div>
                    {keyPairs[selectedKey].unspentNotes.map((n)=>{return n.quantity.amount > 0 ? (<Note n={n} />) : (<></>)})}
                </div>
                {0 === keyPairs[selectedKey].spentNotes.length ? <></> :
                <div className='component note-row'>
                    <div className='header'><InputLabel>Spent Notes</InputLabel></div>
                    {keyPairs[selectedKey].spentNotes.map((n)=>{return n.quantity.amount > 0 ? (<Note n={n} />) : (<></>)})}
                </div>}
                </div>
                <div className='component column'>
                    <div className='header'><InputLabel>Transactions</InputLabel></div>
                    {keyPairs[selectedKey].transactions.slice(0).reverse().map((tx)=>{
                        return !tx.sender &&  tx.receiver ? (<MintTransaction tx={tx} />) :
                                tx.sender && !tx.receiver ? (<BurnTransaction tx={tx} />) : (<ZTransferTransaction tx={tx} />)})}
                </div>
            </div>
            }
        </div>
    )
}