// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import React                from 'react';
import { Header }     from 'semantic-ui-react';

//================================================================//
// SingleColumnContainerView
//================================================================//
export const SingleColumnContainerView = ( props ) => {

    return (
        <div style = {{
            display:        'flex',
            flexDirection:  'column',
            width:          '100%', 
            maxWidth:       '450px',
            margin:         '10px 0 10px 0'
        }}>
            <div>
                <If condition = { props.title && props.title.length > 0 }>
                    <Header as="h2" color="blue" textAlign="center">
                        { props.title }
                    </Header>
                </If>
                { props.children }
            </div>
        </div>
    );
}
