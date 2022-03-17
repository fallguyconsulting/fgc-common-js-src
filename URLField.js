/* eslint-disable no-whitespace-before-property */

import { assert, hooks, RevocableContext }              from 'fgc';
import { action, computed, observable, runInAction }    from 'mobx';
import { observer }                                     from 'mobx-react';
import React, { useEffect, useState }                   from 'react';
import * as UI                                          from 'semantic-ui-react';
import URL                                              from 'url';
import validator                                        from 'validator';

//================================================================//
// URLField
//================================================================//
export const URLField = observer (( props ) => {

    const { url, onURL, ...rest }       = props;

    const [ inputURL, setInputURL ]     = useState ( url || '' );
    const [ error, setError ]           = useState ( '' );

    const update = ( input ) => {

        console.log ( 'UPDATE URL:', input );

        if ( !input ) return;

        if ( validator.isURL ( input, { protocols: [ 'http', 'https' ], require_protocol: true, require_valid_protocol: true, require_tld: false })) {
            const formatted = URL.format ( URL.parse ( input ));
            onURL ( formatted );
            setInputURL ( formatted );
            return;
        }
        setError ( `Please enter a valid URL (including protocol).` );
    };

    useEffect (() => {
        if ( props.value ) {
            update ( props.value );
        }
    },[]);

    const onChange = ( event ) => {
        setError ( '' );
        props.onChange && props.onChange ( event.target.value );
        setInputURL ( event.target.value );
    }

    const onBlur = () => {
        update ( inputURL );
    };

    const onKeyPress = ( event ) => {
        if ( event.key === 'Enter' ) {
            event.target.blur ();
        }
    }

    return (
        <UI.Form.Input
            
            icon            = 'globe'
            iconPosition    = { !props.icon ? 'left' : undefined }
            placeholder     = 'URL'
            error           = { error || false }

            { ...rest }

            type            = 'string'
            value           = { inputURL }
            onChange        = { onChange }
            onKeyPress      = { onKeyPress }
            onBlur          = { onBlur }
        />
    );
});
