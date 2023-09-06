/* eslint-disable no-whitespace-before-property */

import { SingleColumnContainerView }        from '../semantic-ui/SingleColumnContainerView'
import * as textStyle                       from '../draw/textStyle';
import { action, computed, extendObservable, runInAction, observable, observe } from 'mobx';
import { observer }                         from 'mobx-react';
import React, { useState }                  from 'react';
import { Button, Card, Divider, Dropdown, Form, Grid, Header, Icon, Message, Modal, Segment, TextArea } from 'semantic-ui-react';

//================================================================//
// TextStyleScreen
//================================================================//
export const TextStyleScreen = observer (( props ) => {

    const [ text, setText ]     = useState ( '' );

    const onSubmit = () => {
        textStyle.parse ( text );
    }

    return (
        <div>
            <SingleColumnContainerView>
                <Segment>
                    <Form>
                    
                        <TextArea
                            rows = { 8 }
                            value = { text }
                            onChange = {( event ) => { setText ( event.target.value )}}
                        />

                        <div className = "ui hidden divider" ></div>

                        <Button type = 'button' color = "teal" fluid onClick = { onSubmit }>
                            Refresh
                        </Button>
                    </Form>
                </Segment>

            </SingleColumnContainerView>
        </div>
    );
});
