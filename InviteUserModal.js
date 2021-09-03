/* eslint-disable no-whitespace-before-property */

import { assert }                               from './assert';
import { FormErrors }                           from './FormErrors';
import * as hooks                               from './hooks';
import { InviteUserController }                 from './InviteUserController';
import { SessionController }                    from './SessionController';
import * as util                                from './util';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                             from 'mobx-react';
import React, { useState }                      from 'react';
import { Redirect, useLocation }                from 'react-router-dom';
import * as UI                                  from 'semantic-ui-react';

//================================================================//
// InviteUserForm
//================================================================//
export const InviteUserForm = observer (( props ) => {

    const { session, controller, disabled } = props;

    const roleOptions = [
        {
            key: 'user',
            text: 'User',
            value: 'user',
        },
        {
            key: 'developer',
            text: 'Developer',
            value: 'developer',
        },
        {
            key: 'admin',
            text: 'Admin',
            value: 'admin',
        },
    ]

    const handleRolesChange = ( e, {value} ) => {
        controller.setRoles ( value );
    }

    const error = controller.errors.hasFormError ();

    return (
        <UI.Form error = { Boolean ( error )}>
            <UI.Form.Input
                fluid
                icon            = 'mail'
                iconPosition    = 'left'
                placeholder     = 'Email'
                type            = 'email'
                value           = { controller.email }
                disabled        = { disabled }
                onChange        = {( e ) => { controller.setEmail ( e.target.value )}}
                error           = { controller.errors.hasError ( FormErrors.FIELDS.EMAIL, FormErrors.ERRORS.INVALID_EMAIL )}
            />
            <UI.Form.Input fluid>
                <UI.Dropdown
                    fluid
                    selection
                    placeholder = 'Roles' 
                    options     = { roleOptions }
                    onChange    = { handleRolesChange }
                />
            </UI.Form.Input>
            <UI.Message
              error
              header            = 'Error Sending Invitation'
              content           = { error }
            />
        </UI.Form>
    );
});

//================================================================//
// InviteUserModal
//================================================================//
export const InviteUserModal = observer (( props ) => {

    const { session, open } = props;
    const inviteUserController = hooks.useFinalizable (() => new InviteUserController ( session ));

    const onClose = () => {
        inviteUserController.reset ();
        props.onClose ();
    }

    const onSubmit = () => {
        inviteUserController.onSubmit ();
        onClose ();
    }

    return (
        <UI.Modal
            size = 'tiny'
            open = { open }
            onClose = { onClose }
        >   
            <UI.Modal.Content>
                <UI.Header as = 'h4'>Inivte User</UI.Header>
                <InviteUserForm session = { session } controller = { inviteUserController }/>
            </UI.Modal.Content>

            <UI.Modal.Actions>
                <UI.Button
                    positive
                    onClick = { onSubmit }
                    disabled = { !inviteUserController.canSubmit }
                >
                    Send Invitation
                </UI.Button>
            </UI.Modal.Actions>
        </UI.Modal>
    );
});
