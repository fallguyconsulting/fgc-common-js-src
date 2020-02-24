/* eslint-disable no-whitespace-before-property */

import { assert }                               from './assert';
import * as hooks                               from './hooks';
import { util }                                 from './util';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                             from 'mobx-react';
import React, { useState }                      from 'react';
import * as UI                                  from 'semantic-ui-react';

//================================================================//
// UserAccountPopup
//================================================================//
export const UserAccountPopup = observer (( props ) => {

    const [ userPopupOpen, setUserPopupOpen ] = useState ( false );
    const { sessionController } = props;

    return (
        <Choose>
            <When condition = { sessionController.isLoggedIn }>
                <UI.Popup
                    basic
                    eventsEnabled
                    on          = 'click'
                    onClose     = {() => setUserPopupOpen ( false )}
                    onOpen      = {() => setUserPopupOpen ( true )}
                    open        = { userPopupOpen }
                    trigger = {
                        <UI.Image
                            avatar
                            src     = { sessionController.gravatar }
                            style   = {{ maxWidth: '22px', maxHeight: '22px' }}
                        />
                    }
                >
                    <React.Fragment>
                        <center>
                            <UI.Image
                                avatar
                                as          = 'a'
                                href        = 'https://en.gravatar.com/'
                                target      = '_blank'
                                src         = { sessionController.gravatar }
                                style       = {{ 'fontSize': '42px' }}
                            />
                            <UI.Header as = 'h4'>{ sessionController.publicName }</UI.Header>
                        </center>
                        <UI.Menu secondary vertical>
                            <UI.Menu.Item
                              onClick = {() => { sessionController.logout ()}}
                            >
                                <UI.Icon name = 'power off'/>
                                Log Out
                            </UI.Menu.Item>
                        </UI.Menu>
                    </React.Fragment>
                </UI.Popup>
            </When>
            <Otherwise>
                <UI.Label
                    color = 'orange'
                    onClick = {() => { sessionController.login ()}}
                >
                    <UI.Icon name = 'bullhorn'/>
                    Log In
                </UI.Label>
            </Otherwise>
        </Choose>
    );
});
