import * as React from 'react'
import Button from '@material-ui/core/Button';

function GlobalStats({onSync})
{
    return (
      <div>
        <Button onClick={()=>onSync()}>Sync</Button>
      </div>
    )
}

export default GlobalStats