/* eslint-disable no-whitespace-before-property */

import handlebars           from 'handlebars';
import React                from 'react';
import { useDropzone }      from 'react-dropzone'
import * as UI              from 'semantic-ui-react';

//================================================================//
// DropzoneScreen
//================================================================//
export const DropzoneScreen = ( props ) => {

    const onDrop = ( acceptedFiles ) => {
        console.log ( acceptedFiles );
    }
    const { getRootProps, getInputProps, isDragActive } = useDropzone ({ onDrop })

    return (
        <div { ...getRootProps ()}>
            <UI.Segment placeholder textAlign = 'center'>
                <input { ...getInputProps ()}/>
                {
                    isDragActive ?
                        <p>Drop the files here ...</p> :
                        <p>Drag 'n' drop some files here, or click to select files</p>
                }
            </UI.Segment>
        </div>
    );
}
