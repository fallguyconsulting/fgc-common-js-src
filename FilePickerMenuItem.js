// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { observer }                                         from 'mobx-react';
import React, { Fragment, useState, useRef }                from 'react';
import { Button, Icon, Menu }                               from 'semantic-ui-react';

//================================================================//
// FilePickerMenuItem
//================================================================//
export const FilePickerMenuItem = observer (( props ) => {

    const { loadFile } = props;

    const [ file, setFile ]                 = useState ( false );
    const filePickerRef                     = useRef ();

    const onFilePickerChange = ( event ) => {
        event.stopPropagation ();
        const picked = event.target.files.length > 0 ? event.target.files [ 0 ] : false;
        if ( picked ) {
            setFile ( picked );
            if ( loadFile ) {
                loadFile ( picked );
            }
        }
    }

    const hasFile = ( file !== false );

    return (
        <React.Fragment>

            <input
                key = { file ? file.name : ':file picker:' }
                style = {{ display:'none' }}
                ref = { filePickerRef }
                type = 'file'
                accept = '.xls, .xlsx'
                onChange = { onFilePickerChange }
            />

            <Menu.Item
                onClick = {() => filePickerRef.current.click ()}
            >
                <Icon name = 'folder open outline'/>
            </Menu.Item>

            <Menu.Item>
                <Button
                    disabled = { !hasFile }
                    onClick = {() => { loadFile && loadFile ( file )}}
                >
                    { hasFile ? file.name : 'No File Chosen' }
                </Button>
            </Menu.Item>

        </React.Fragment>
    );
});
