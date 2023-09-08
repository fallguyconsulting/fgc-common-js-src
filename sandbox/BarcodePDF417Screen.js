/* eslint-disable no-whitespace-before-property */
/* eslint-disable no-loop-func */

import { SingleColumnContainerView }    from '../semantic-ui/SingleColumnContainerView'
import * as pdf417                      from '../barcode/pdf417';
import { observer }                     from 'mobx-react';
import React, { useState }              from 'react';
import { Form, Segment } from 'semantic-ui-react';

//================================================================//
// BarcodePDF417Screen
//================================================================//
export const BarcodePDF417Screen = observer (( props ) => {

    const [ data, setData ]             = useState ( 'xxxxx.xxxxx.xxxxx-123' );
    const [ docWidth, setDocWidth ]     = useState ( 1.5 );
    const [ docHeight, setDocHeight ]   = useState ( 0.25 );

    const w = docWidth * 100;
    const h = docWidth * 100;

    const barcodeSVG = pdf417.makeSVGTag ( data, 0, 0, w, h );

    return (
        <SingleColumnContainerView title = 'Test PDF417'>
            <Form size = 'large'>
                <Segment stacked>
                    <Form.TextArea
                        rows = { 5 }
                        placeholder = "Barcode Data"
                        value = { data }
                        onChange = {( event ) => { setData ( event.target.value )}}
                    />
                    <Form.Input
                        fluid
                        type = 'number'
                        value = { docWidth }
                        onChange = {( event ) => { setDocWidth ( event.target.value )}}
                    />
                    <Form.Input
                        fluid
                        type = 'number'
                        value = { docHeight }
                        onChange = {( event ) => { setDocHeight ( event.target.value )}}
                    />
                    <div className = 'ui hidden divider' ></div>
                    <svg
                        version = '1.1'
                        baseProfile = 'basic'
                        xmlns = 'http://www.w3.org/2000/svg'
                        width = { `${ docWidth }in` }
                        height = { `${ docHeight }in` }
                        viewBox = { `0 0 ${ w } ${ h }` }
                        preserveAspectRatio = 'none'
                    >
                        <g>
                            <rect x = '0' y = '0' width = { w } height = { h } fill = 'white'/>
                            <g dangerouslySetInnerHTML = {{ __html: barcodeSVG }}/>
                        </g>
                    </svg>
                </Segment>
            </Form>
        </SingleColumnContainerView>
    );
});
