import * as React from 'react'

function UALLogin({ ual: { activeUser, activeAuthenticator, logout, showModal }, appActiveUser, onChange })
{
    if(activeUser && !appActiveUser)
    {
        onChange(activeUser);
    }
    else if(!activeUser && appActiveUser)
    {
        onChange(null);
    }

    const renderModalButton = () =>
    {
        return (
            <p className='ual-btn-wrapper'>
            <span
                role='button'
                onClick={showModal}
                className='ual-generic-button'>Show UAL Modal</span>
            </p>
        )
    }

    const renderLogoutBtn = () => 
    {
        return (
            <p className='ual-btn-wrapper'>
            <span className='ual-generic-button red' onClick={logout}>
                {'Logout'}
            </span>
            </p>
        )
    }

    return (
        <div>
            {activeUser ? (!!activeUser && !!activeAuthenticator ? renderLogoutBtn() : <div></div>) : renderModalButton()}
        </div>
    );
}

export default UALLogin