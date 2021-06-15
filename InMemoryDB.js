/* eslint-disable no-whitespace-before-property */

import { assert }                   from './assert';

//================================================================//
// InMemoryDB
//================================================================//
export class InMemoryDB {

    //----------------------------------------------------------------//
    constructor () {

        this.store = {};
    }

    //----------------------------------------------------------------//
    makeConnection () {

        return this.store;
    }
}
