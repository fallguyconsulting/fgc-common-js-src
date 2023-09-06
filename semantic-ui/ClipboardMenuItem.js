// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { observer }                                         from 'mobx-react';
import React, { Fragment, useState, useRef }                from 'react';
import { Button, Icon, Menu }                               from 'semantic-ui-react';

//================================================================//
// ClipboardMenuItem
//================================================================//
export const ClipboardMenuItem = observer (( props ) => {

    const { value, iconName }   = props;
    const textAreaRef           = useRef ();

    const onCopy = () => {
        if ( textAreaRef.current ) {
            textAreaRef.current.select ();
            document.execCommand ( 'copy' );
        }
    }

    const hasText = ( value && ( typeof ( value ) == 'string' ) && ( value.length > 0 ));

    return (
        <Menu.Item
            name = "Copy"
            onClick = { onCopy }
            disabled = { !hasText }
        >
            <Icon name = { iconName || 'clipboard' }/>

            <If condition = { hasText }>
                <textarea
                    readOnly
                    ref     = { textAreaRef }
                    value   = { value }
                    style = {{ position: 'absolute', top: '-1000px' }}
                />
            </If>
        </Menu.Item>
    );
});
