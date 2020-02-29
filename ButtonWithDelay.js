/* eslint-disable no-whitespace-before-property */

import * as hooks                               from './hooks';
import { observer }                             from 'mobx-react';
import React, { useRef, useState }              from 'react';
import * as UI                                  from 'semantic-ui-react';

//================================================================//
// ButtonWithDelay
//================================================================//
export const ButtonWithDelay = observer (( props ) => {

    const buttonRef = useRef ();

    const [ disabled, setDisabled ] = useState ( props.disabled );
    const [ timer, setTimer ] = useState ( false );

    hooks.useFinalizer (() => {
        if ( timer ) {
            clearTimeout ( timer );
        }
    });

    const handleMouse = ( event ) => {
        
        document.removeEventListener ( 'mouseup', handleMouse );

        props.onClick ( event );
        const delay = props.delay || 100;
        setTimer ( setTimeout (() => { setDisabled ( false )}, delay ));
    };
    
    const handleMouseDown = ( event ) => {

        setDisabled ( true );
        event.stopPropagation ();
        event.preventDefault ();
        document.addEventListener ( 'mouseup', handleMouse );
    };

    return (
        <UI.Button
            { ...props }
            ref             = { buttonRef }
            onMouseDown     = { handleMouseDown }
            onClick         = {() => {}}
            disabled        = { disabled }
        >
            { props.children }
        </UI.Button>
    );
});
