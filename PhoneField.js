/* eslint-disable no-whitespace-before-property */

import * as consts                                      from 'consts';
import { assert, hooks, RevocableContext }              from 'fgc';
import libphone                                         from 'google-libphonenumber';
import { action, computed, observable, runInAction }    from 'mobx';
import { observer }                                     from 'mobx-react';
import React, { useState }                              from 'react';
import * as UI                                          from 'semantic-ui-react';

//================================================================//
// PhoneField
//================================================================//
export const PhoneField = observer (( props ) => {

    const { onPhone, ...rest }      = props;

    const [ init, setInit ]         = useState ( props.value || false );
    const [ phone, setPhone ]       = useState ( '' );
    const [ error, setError ]       = useState ( '' );

    const update = ( input ) => {

        if ( !input ) return;

        try {
            const phoneUtil = libphone.PhoneNumberUtil.getInstance ();
            const phoneNumber = phoneUtil.parse ( input, 'US' );

            if ( phoneUtil.isValidNumber ( phoneNumber )) {
                const formatted = phoneUtil.format ( phoneNumber, libphone.PhoneNumberFormat.NATIONAL );
                onPhone ( formatted );
                setPhone ( formatted );
                return;
            }
        }
        catch ( error ) {
            console.log ( error );
        }
        setError ( 'Please enter a valid phone number.' );
    }

    if ( init ) {
        update ( init );
        setInit ( false );
    }

    const onChange = ( event ) => {
        setError ( '' );
        setPhone ( event.target.value );
    }

    const onBlur = () => {
        update ( phone );
    };

    const onKeyPress = ( event ) => {
        if ( event.key === 'Enter' ) {
            event.target.blur ();
        }
    }

    return (
        <UI.Form.Input
            
            icon            = 'phone'
            iconPosition    = 'left'
            placeholder     = 'Phone Number'

            { ...rest }

            type            = 'string'
            value           = { phone }
            onChange        = { onChange }
            onKeyPress      = { onKeyPress }
            onBlur          = { onBlur }
            error           = { error || false }
        />
    );
});
