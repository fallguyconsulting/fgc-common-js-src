// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import * as util            from '../util';

//================================================================//
// DBColumnBuilder
//================================================================//
export class DBColumnBuilder {

    dbName              = '';
    jsName              = '';

    def = {
        type:           'TEXT',
        nullable:       'NOT NULL',
        increment:      '',
        value:          null,
        serialized:     false,
    };

    opt = {
        was:            '',
    }

    //----------------------------------------------------------------//
    boolean () {
        this.def.type = 'BOOLEAN';
        return this;
    }

    //----------------------------------------------------------------//
    constructor ( dbName, jsName ) {

        this.dbName = dbName;
        this.jsName = jsName;
    }

    //----------------------------------------------------------------//
    foreign ( tableName, columnName ) {

        this.def.foreign = {
            tableName:      util.camelToSnake ( tableName ),
            columnName:     util.camelToSnake ( columnName ),
        }
    }

    //----------------------------------------------------------------//
    increment () {
        this.def.increment = `AUTO_INCREMENT`;
        return this;
    }

    //----------------------------------------------------------------//
    integer ( size ) {
        this.def.type = size ? `INT(${ size }) UNSIGNED` : 'INT UNSIGNED';
        return this;
    }

    //----------------------------------------------------------------//
    primary () {
        this.opt.isPrimary = true;
        return this;
    }

    //----------------------------------------------------------------//
    nullable () {
        this.def.nullable = '';
        return this;
    }

    //----------------------------------------------------------------//
    string ( maxLength ) {
        this.def.type = `VARCHAR ( ${ maxLength || 255 } )`
        return this;
    }

    //----------------------------------------------------------------//
    text ( maxLength ) {
        this.def.type = `TEXT`
        return this;
    }

    //----------------------------------------------------------------//
    serialized () {
        this.def.type           = `TEXT`
        this.def.value          = null;
        this.def.serialized     = true;
        return this;
    }

    //----------------------------------------------------------------//
    value ( value ) {
        this.def.value = value;
        return this;
    }

    //----------------------------------------------------------------//
    was ( name ) {
        this.opt.was = name;
        return this;
    }
}
