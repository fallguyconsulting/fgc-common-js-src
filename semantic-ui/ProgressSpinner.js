// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import React                        from 'react';
import * as UI                      from 'semantic-ui-react';

//================================================================//
// ProgressSpinner
//================================================================//
export const ProgressSpinner = ( props ) => {

    const { loading, message } = props;

    return (
        <Choose>

            <When condition = { loading }>
                <UI.Loader
                    active
                    inline = 'centered'
                    size = 'massive'
                    style = {{ marginTop:'5%' }}
                >
                    { message }
                </UI.Loader>
            </When>

            <Otherwise>
                { props.children }
            </Otherwise>

        </Choose>
    );
}
