/* eslint-disable no-whitespace-before-property */
/* eslint-disable no-loop-func */

import { Service, useService }          from '../Service';
import { SingleColumnContainerView }    from '../SingleColumnContainerView'
import * as crypto                      from '../crypto';
import * as util                        from '../util';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                     from 'mobx-react';
import React, { useState }              from 'react';
import { Button, Divider, Dropdown, Form, Grid, Header, Icon, Modal, Segment } from 'semantic-ui-react';

//================================================================//
// AESScreenController
//================================================================//
class AESScreenController extends Service {

    @observable message         = '';
    @observable password        = '';
    @observable ciphertext      = '';
    @observable plaintext       = '';

    //----------------------------------------------------------------//
    constructor ( appState ) {
        super ();
    }

    //----------------------------------------------------------------//
    @action
    setMessage ( message ) {
        this.message = message;
        this.update ();
    }

    //----------------------------------------------------------------//
    @action
    setPassword ( password ) {
        this.password = password;
        this.update ();
    }

    //----------------------------------------------------------------//
    @action
    update () {

        this.ciphertext     = crypto.aesPlainToCipher ( this.message, this.password );
        this.plaintext      = crypto.aesCipherToPlain ( this.ciphertext, this.password );
    }
}

//================================================================//
// AESScreen
//================================================================//
export const AESScreen = observer (( props ) => {

    const controller    = useService (() => new AESScreenController ());

    return (
        <SingleColumnContainerView title = 'Test AES Encryption'>
            <Form size = "large">
                <Segment stacked>
                    <Form.TextArea
                        rows = { 8 }
                        placeholder = "Message"
                        name = "message"
                        value = { controller.message }
                        onChange = {( event ) => { controller.setMessage ( event.target.value )}}
                    />
                    <input
                        placeholder = "Password"
                        type = "text"
                        value = { controller.password }
                        onChange = {( event ) => { controller.setPassword ( event.target.value )}}
                    />
                    <div className = "ui hidden divider" ></div>
                    <Segment raised style = {{ wordWrap: 'break-word' }}>{ controller.ciphertext }</Segment>
                    <Segment raised style = {{ wordWrap: 'break-word' }}>{ controller.plaintext }</Segment>
                </Segment>
            </Form>
        </SingleColumnContainerView>
    );
});