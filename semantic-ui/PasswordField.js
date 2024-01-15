// Copyright (c) 2022 Fall Guy LLC All Rights Reserved.

import owasp                    from '../contrib/owasp-password-strength-test';
import { observer }             from 'mobx-react';
import React, { useState }      from 'react';
import * as UI                  from 'semantic-ui-react';

const PASSWORD_REGEX = /^[0-9a-zA-Z~`!?@#$%^&()_+*\-=/,.{}<>:;'"|[\]\\]+$/;

//================================================================//
// PasswordField
//================================================================//
export const PasswordField = observer (( props ) => {

    const { onPassword, newPassword, regex, strict, ...rest } = props;
    const [ password, setPassword ]         = useState ( '' );
    const [ error, setError ]               = useState ( '' );

    const onChange = ( event ) => {

        const value = event.target.value;

        setError ( '' );
        setPassword ( value );

        if ( value ) {
            if (( regex === false ) || ( regex || PASSWORD_REGEX ).test ( value )) {
                onPassword ( value );
                return;
            }
            else {
                setError ( 'Password contains illegal characters.' );
            }
        }
        onPassword ( '' );
    };

    const onBlur = () => {
        if ( error || !( password && strict )) return;
        const strength = owasp.test ( password );
        if ( strength.errors.length > 0 ) {
            setError ( strength.errors.join ( ' ' ));
        }
    };

    return (
        <UI.Form.Input
            
            icon            = 'lock'
            iconPosition    = { !props.icon ? 'left' : undefined }
            placeholder     = 'Password'
            error           = { error || false }
            autoComplete    = { newPassword ? 'new-password' : 'current-password' }

            { ...rest }

            type            = 'password'
            value           = { password }
            onChange        = { onChange }
            onBlur          = { onBlur }
        />
    );
});
