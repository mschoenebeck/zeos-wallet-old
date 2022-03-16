import * as React from 'react'
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';

function UALLogin({ ual: { activeUser, activeAuthenticator, logout, showModal }, appActiveUser, username, zeosBalance, onChange })
{
    if(activeUser && !appActiveUser)
    {
        onChange(activeUser);
    }
    else if(!activeUser && appActiveUser)
    {
        onChange(null);
    }

    return (
        <div>
            <InputLabel>{appActiveUser ? username :  <div></div>}</InputLabel>
            <InputLabel>{appActiveUser ? zeosBalance :  <div></div>}</InputLabel>
            {!!activeUser && !!activeAuthenticator ? <Button onClick={logout}>Logout</Button> : <Button onClick={showModal}>UAL Modal</Button>}
        </div>
    );
}

export default UALLogin