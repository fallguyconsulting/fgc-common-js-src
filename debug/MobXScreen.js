/* eslint-disable no-whitespace-before-property */

import { Service, useService }              from '../Service';
import { action, computed, observable }     from "mobx";
import { observer }                         from "mobx-react";
import React                                from 'react';

//================================================================//
// MobXScreenStore
//================================================================//
class MobXScreenStore extends Service {

    @observable index = 0;

    //----------------------------------------------------------------//
    constructor ( values ) {
        super ();
        this.values = values;
    }

    //----------------------------------------------------------------//
    @action
    select ( index ) {
        if (( index < 0 ) || ( index >= this.values.length )) return;
        this.index = index;
    }

    //----------------------------------------------------------------//
    @computed
    get selection () {
        return this.values [ this.index ];
    }
}

//================================================================//
// MobXScreen
//================================================================//
export const MobXScreen = observer (( props ) => {

    const store = useService (() => new MobXScreenStore ([ 'foo', 'doop', 'moop' ]));

    const onKeyDown = ( e ) => {
        if ( e.keyCode === 38 ) {
            store.select ( store.index - 1 );
        }
        else if ( e.keyCode === 40 ) {
            store.select ( store.index + 1 );
        }
    }

    const onSelect = ( index ) => {
        console.log ( 'ON SELECT', index );
        store.select ( index );
    }

    const selection = store.selection;

    // also using JSX-Control-Statements plugin
    return (
        <div>
            <Choose>
                <When condition = { selection === 'moop' }>
                    <h3>{ 'Hooray! You selected the winning option!' }</h3>
                </When>
                <Otherwise>
                    <h3>{ 'Pick one...' }</h3>
                </Otherwise>
            </Choose>
            <ul onKeyDown = {( e ) => onKeyDown ( e )} tabIndex = { 0 }>
                { store.values.map (( value, index ) =>
                    <li
                        className   = { value === selection ? 'selected' : '' }
                        key         = { index }
                        onClick     = {() => onSelect ( index )}
                    >
                        { value }
                    </li> 
                )}  
            </ul>
            { selection }
        </div>
    );
});
