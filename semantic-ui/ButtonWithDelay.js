/* eslint-disable no-whitespace-before-property */

import * as hooks                               from '../site/hooks';
import { observer }                             from 'mobx-react';
import React, { useRef, useState }              from 'react';
import * as UI                                  from 'semantic-ui-react';

//================================================================//
// ButtonWithDelay
//================================================================//
export const ButtonWithDelay = observer (( props ) => {

    const [ busy, setBusy ]     = useState ( false );
    const [ timer, setTimer ]   = useState ( false );

    const setTimerFinalizer = hooks.useFinalizer (( timer ) => {
        if ( timer ) {
            clearTimeout ( timer );
        }
    });

    if ( timer && click ) {
        props.onClick ( event );
        setClick ( false );
    }

    const handleMouse = ( event ) => {
        
        document.removeEventListener ( 'mouseup', handleMouse );

        const delay = props.delay || 100;
        setTimerFinalizer ( setTimeout (() => { setBusy ( false )}, delay ));
        props.onClick ( event );
    };
    
    const handleMouseDown = ( event ) => {

        setBusy ( true );
        event.stopPropagation ();
        event.preventDefault ();
        document.addEventListener ( 'mouseup', handleMouse );
    };

    return (
        <UI.Button
            { ...props }
            onMouseDown     = { handleMouseDown }
            onClick         = {() => {}}
            disabled        = { busy || props.disabled }
        >
            { props.children }
        </UI.Button>
    );
});
