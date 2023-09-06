// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { observer }                                         from 'mobx-react';
import React, { Fragment, useState, useRef }                from 'react';
import { Button, Icon, Menu }                               from 'semantic-ui-react';

//================================================================//
// FilePickerMenuItem
//================================================================//
export const FilePickerMenuItem = observer (( props ) => {

    const loadFile              = props.loadFile;
    const format                = props.format || false;
    const accept                = props.accept || '*.*';
    const disabled              = props.disabled || false;
    const loading               = props.loading || false;

    const [ file, setFile ]                 = useState ( false );
    const filePickerRef                     = useRef ();

    const loadFileWithFormat = ( picked ) => {
        const reader = new FileReader ();

        reader.onabort = () => { console.log ( 'file reading was aborted' )}
        reader.onerror = () => { console.log ( 'file reading has failed' )}
        reader.onload = () => { loadFile ( reader.result )}

        switch ( format ) {

            case 'binary':
                reader.readAsBinaryString ( picked );
                break;

            case 'text':
                reader.readAsText ( picked );
                break;
        }
    }

    const reloadFile = ( picked ) => {
        if ( picked && loadFile ) {
            format ? loadFileWithFormat ( picked ) : loadFile ( picked );
        }
    }

    const onFilePickerChange = ( event ) => {
        event.stopPropagation ();
        const picked = event.target.files.length > 0 ? event.target.files [ 0 ] : false;
        if ( picked ) {
            setFile ( picked );
            reloadFile ( picked );
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
                accept = { accept }
                onChange = { onFilePickerChange }
            />

            <Menu.Item
                onClick = {() => filePickerRef.current.click ()}
                disabled = { disabled }
            >
                <Choose>
                    <When condition = { loading }>
                        <Icon name = 'circle notched' loading/>
                    </When>
                    <Otherwise>
                        <Icon name = { props.icon || 'folder open outline' }/>
                    </Otherwise>
                </Choose>
            </Menu.Item>

            <If condition = { !props.hideReloadButton }>
                <Menu.Item>
                    <Button
                        disabled = { !hasFile }
                        onClick = {() => { reloadFile ( file )}}
                    >
                        { hasFile ? file.name : 'No File Chosen' }
                    </Button>
                </Menu.Item>
            </If>

        </React.Fragment>
    );
});
