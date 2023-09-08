/* eslint-disable no-whitespace-before-property */

import { SingleColumnContainerView }        from '../semantic-ui/SingleColumnContainerView'
import { observer }                         from 'mobx-react';
import React, { useRef, useState }          from 'react';
import { Button, Form, Message, Segment } from 'semantic-ui-react';

//================================================================//
// FilePickerScreen
//================================================================//
export const FilePickerScreen = observer (( props ) => {

    const [ file, setFile ]                 = useState ( false );
    const [ fileString, setFileString ]     = useState ( '' );
    const filePickerRef                     = useRef ();

    const reloadFile = ( picked ) => {

        if ( !picked ) return;

        const reader = new FileReader ();
        reader.onabort = () => { console.log ( 'file reading was aborted' )}
        reader.onerror = () => { console.log ( 'file reading has failed' )}
        reader.onload = () => {
            setFileString ( reader.result );
        }
        reader.readAsBinaryString ( picked );
    }

    const onFilePickerChange = ( event ) => {
        const picked = event.target.files.length > 0 ? event.target.files [ 0 ] : false;
        if ( picked ) {
            setFile ( picked );
            reloadFile ( picked );
        }
    }

    const hasFile = ( file !== false );

    return (
        
        <div>
            <SingleColumnContainerView title = 'Test File Picker'>

                <input
                    style = {{ display:'none' }}
                    ref = { filePickerRef }
                    type = 'file'
                    onChange = { onFilePickerChange }
                />
            
                <Segment>
                    <Form size = 'large' error = { false }>
                        
                        <Button
                            fluid
                            onClick = {() => filePickerRef.current.click ()}
                        >
                            Choose File
                        </Button>

                        <div className = 'ui hidden divider' ></div>

                        <Button
                            fluid
                            disabled = { !hasFile }
                            onClick = {() => { reloadFile ( file )}}
                        >
                            { hasFile ? file.name : 'No File Chosen' }
                        </Button>
                        
                        <Message
                            error
                            header  = 'QR Code Error'
                            content = { '' }
                        />
                    </Form>
                </Segment>

            </SingleColumnContainerView>

            <div>
                { fileString }
            </div>
        </div>
    );
});
