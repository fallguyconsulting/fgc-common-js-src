/* eslint-disable no-whitespace-before-property */

import * as consts                                      from 'consts';
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

    const { onURL, ...rest }        = props;

    const [ url, setURL ]           = useState ( '' );
    const [ error, setError ]       = useState ( '' );

    const update = ( input ) => {

        if ( !input ) return;

        if ( validator.isURL ( input, { require_protocol: true, require_valid_protocol: true, protocols: [ 'http', 'https' ]})) {
            const formatted = URL.format ( URL.parse ( input ));
            onURL ( formatted );
            setURL ( formatted );
            return;
        }
        setError ( `Please enter a valid URL (including protocol).` );
    };

    useEffect (() => {
        if ( props.value ) {
            update ( props.value );
        }
    });

    const onChange = ( event ) => {
        setError ( '' );
        setURL ( event.target.value );
    }

    const onBlur = () => {
        update ( url );
    };

    const onKeyPress = ( event ) => {
        if ( event.key === 'Enter' ) {
            event.target.blur ();
        }
    }

    return (
        <UI.Form.Input
            
            icon            = 'globe'
            iconPosition    = 'left'
            placeholder     = 'URL'

            { ...rest }

            type            = 'string'
            value           = { url }
            onChange        = { onChange }
            onKeyPress      = { onKeyPress }
            onBlur          = { onBlur }
            error           = { error || false }
        />
    );
});
