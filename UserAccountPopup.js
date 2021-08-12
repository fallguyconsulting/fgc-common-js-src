/* eslint-disable no-whitespace-before-property */

import { assert }                               from './assert';
import * as roles                               from './roles';
import * as hooks                               from './hooks';
import { InviteUserModal }                      from './InviteUserModal';
import { util }                                 from './util';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                             from 'mobx-react';
import React, { useState }                      from 'react';
import * as UI                                  from 'semantic-ui-react';

//================================================================//
// UserAccountPopup
//================================================================//
export const UserAccountPopup = observer (( props ) => {

    const [ userPopupOpen, setUserPopupOpen ]               = useState ( false );
    const [ inviteUserModalOpen, setInviteUserModalOpen ]   = useState ( false );
    const { sessionController }                             = props;

    const session = sessionController;

    const onClickLogin = () => {
        setUserPopupOpen ( false );
        session.login ();
    }

    const onClickInviteUser = () => {
        setUserPopupOpen ( false );
        setInviteUserModalOpen ( true );
    }

    const onInviteUserModalClose = () => {
        setInviteUserModalOpen ( false );
    }

    return (
        <React.Fragment>

            <InviteUserModal
                session         = { session }
                open            = { inviteUserModalOpen }
                onClose         = { onInviteUserModalClose }
            />

            <Choose>
                <When condition = { session.isLoggedIn }>
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
                                src     = { session.gravatar }
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
                                    src         = { session.gravatar }
                                    style       = {{ 'fontSize': '42px' }}
                                />
                                <UI.Header as = 'h4'>{ session.publicName }</UI.Header>
                            </center>
                            <UI.Menu secondary vertical style = {{ margin: '0px' }}>
                                <UI.Menu.Item
                                href = '/'
                                onClick = {() => { session.logout ()}}
                                >
                                    <UI.Icon name = 'power off'/>
                                    Log Out
                                </UI.Menu.Item>
                            </UI.Menu>

                            <If condition = { roles.canInviteUser ( session.roles )}>
                                <div
                                    onClick = { onClickInviteUser }
                                    style   = {{
                                        fontSize:   '12px',
                                        textAlign:  'center',
                                        cursor:     'pointer',
                                        color:      'blue',
                                    }}
                                >
                                    Invite
                                </div>
                            </If>
                        </React.Fragment>
                    </UI.Popup>
                </When>

                <Otherwise>
                    <UI.Label
                        color = 'orange'
                        onClick = { onClickLogin }
                    >
                        <UI.Icon name = 'bullhorn'/>
                        Log In
                    </UI.Label>
                </Otherwise>
            </Choose>

        </React.Fragment>
    );
});
