// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import _                            from 'lodash';
import { Parser }                   from 'saxen';

export const VISIT = {
    CONTINUE:       'CONTINUE',
    SKIP:           'SKIP',
    DONE:           'DONE',
};

//================================================================//
// helpers
//================================================================//

//----------------------------------------------------------------//
function _findElementsByPath ( root, findAll, qualifiers ) {

    let results = [];
    let more = true;

    let depth = 0;

    const recurse = ( element ) => {

        let didMatch = false;
        if ( _matchElement ( element, qualifiers [ depth ])) {
            didMatch = true;
            depth++;
        }

        if ( depth === qualifiers.length ) {
            results.push ( element );
            more = findAll;
        }
        else {
            for ( let child of element.children ) {
                if ( !more ) return;
                recurse ( child );
            }
        }

        if ( didMatch ) {
            depth--;
        }
    }
    recurse ( root );
    return findAll ? results : results [ 0 ];
}

//----------------------------------------------------------------//
function _matchElement ( element, qualifier ) {

    switch ( typeof ( qualifier )) {
        case 'string':      return ( element.name === qualifier );
        case 'function':    return qualifier ( element );
    }
    return true;
}

//================================================================//
// dom
//================================================================//

//----------------------------------------------------------------//
export function findElement ( root, qualifier ) {

    let result;
    visit ( root, qualifier, ( name, attr, elem ) => {
        result = elem;
        return VISIT.DONE;
    });
    return result;
}

//----------------------------------------------------------------//
export function findElements ( root, qualifier ) {

    let results = [];
    visit ( root, qualifier, ( name, attr, elem ) => {
        results.push ( elem );
        return VISIT.SKIP;
    });
    return results;
}

//----------------------------------------------------------------//
export function findElementByPath ( root, ...qualifiers ) {

    return _findElementsByPath ( root, false, qualifiers );
}

//----------------------------------------------------------------//
export function findElementsByPath ( root, ...qualifiers ) {

    return _findElementsByPath ( root, true, qualifiers );
}

//----------------------------------------------------------------//
export function matchHasAttribute ( attrName ) {

    return ( element ) => {
        return _.has ( element, attrName );
    }
}

//----------------------------------------------------------------//
export function parse ( xml, multiroot ) {

    var parser = new Parser ();

    let roots = [];
    let stack = [];
    let top = -1;

    parser.on ( 'openTag', ( elementName, attrGetter, decodeEntities, selfClosing, getContext ) => {

        const element = {
            name:       elementName,
            attr:       attrGetter (),
            children:   [],
        };
        stack.push ( element );
        top++;
    });

    parser.on ( 'text', ( value, decodeEntities, contextGetter ) => {

        stack [ top ].text = value;
    });

    parser.on ( 'closeTag', ( elementName, decodeEntities, selfClosing, contextGetter ) => {

        const element = stack.pop ();
        top--;

        if ( top >= 0 ) {
            stack [ top ].children.push ( element );
        }
        else {
            roots.push ( element );
        }
    });

    parser.parse ( xml );
    return multiroot ? roots : roots [ 0 ];
}

//----------------------------------------------------------------//
export function visit ( root, qualifier, visitor ) {

    let status = VISIT.CONTINUE;

    const recurse = ( element ) => {

        if ( _matchElement ( element, qualifier )) {
            status = visitor ( element.name, element.attr, element ) || VISIT.CONTINUE;
            if ( status === VISIT.SKIP ) {
                status = VISIT.CONTINUE;
                return;
            }
        }

        for ( let child of element.children ) {
            if ( status === VISIT.DONE ) return;
            recurse ( child );
        }
    }
    recurse ( root );
}
