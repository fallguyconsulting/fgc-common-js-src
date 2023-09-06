/* eslint-disable no-whitespace-before-property */

import { action, computed, observable, runInAction }    from 'mobx';
import { observer }                                     from 'mobx-react';
import React, { useState }                              from 'react';
import * as UI                                          from 'semantic-ui-react';
import validator                                        from 'validator';

//================================================================//
// EmailField
//================================================================//
export const EmailField = observer (( props ) => {

    const { onEmail, ...rest }      = props;

    const [ email, setEmail ]       = useState ( '' );
    const [ error, setError ]       = useState ( '' );

    const onChange = ( event ) => {
        
        const value = event.target.value;

        setError ( '' );
        onEmail ( '' );
        setEmail ( value );

        if ( value ) {
            if ( validator.isEmail ( value )) {
                onEmail ( value );
            }
        }
    }

    const onBlur = () => {

        if ( email ) {
            if ( validator.isEmail ( email )) {
                onEmail ( email );
            }
            else {
                setError ( 'Please enter a valid email address.' );
            }
        }
    };

    const onKeyPress = ( event ) => {
        if ( event.key === 'Enter' ) {
            event.target.blur ();
        }
    }

    return (
        <UI.Form.Input
            
            icon            = 'mail'
            iconPosition    = { !props.icon ? 'left' : undefined }
            placeholder     = 'Email'

            { ...rest }

            type            = 'email'
            value           = { email }
            onChange        = { onChange }
            onKeyPress      = { onKeyPress }
            onBlur          = { onBlur }
            error           = { error || false }
        />
    );
});
