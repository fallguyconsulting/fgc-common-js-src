// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as util        from '../util';

//----------------------------------------------------------------//
function affirmCollationBranchRecurse ( scheme, row, node, context, depth ) {

    depth = depth || 0;
    node = node || {};

    util.affirmObjectField ( node, 'key', '' );
    util.affirmObjectField ( node, 'children', {});
    util.affirmObjectField ( node, 'row', row );
    util.affirmObjectField ( node, 'depth', depth );
    util.affirmObjectField ( node, 'order', null );
    
    if ( depth >= scheme.length ) return;

    context = context || {};
    const keyOrTuple = scheme [ depth ] && scheme [ depth ]( row, context );
    
    if (( keyOrTuple === undefined ) || ( keyOrTuple === null )) return;

    let key = keyOrTuple;
    let order = null;
    
    if ( typeof ( keyOrTuple ) === 'object' ) {
        key = keyOrTuple.key;
        order = ( typeof ( keyOrTuple.order ) === 'number' ) ? keyOrTuple.order : null;
    }

    if (( key === undefined ) || ( key === null )) return;

    key = String ( key );
    node = util.affirmObjectField ( node.children, key, { key: key, order: order });
    affirmCollationBranchRecurse ( scheme, row, node, context, depth + 1 );
}

//----------------------------------------------------------------//
export function buildCollationTree ( scheme, rows, root, context ) {

    if ( !rows ) return;

    root = root || {};
    for ( let row of rows ) {
        affirmCollationBranchRecurse ( scheme, row, root, context || {});
    }
    return root;
}

//----------------------------------------------------------------//
export function buildAndFormatCollationTree ( scheme, format, rows, context ) {

    const node = buildCollationTree ( scheme, rows, {}, context );
    return formatCollationTree ( format, node, context );
}

//----------------------------------------------------------------//
export function formatCollationTree ( format, node, context ) {
    return formatCollationTreeRecurse ( format, node || {}, context );
}

//----------------------------------------------------------------//
function formatCollationTreeRecurse ( format, node, context ) {

    const depth = node.depth;
    if ( !format [ depth ]) return;

    context = context || {};

    const children = Object.values ( node.children ).sort ( sortChildren ).map (( child ) => formatCollationTreeRecurse (
        format,
        child,
        context
    ));

    return format [ depth ]( node.row, node.key, children, context, depth ); 
}

//----------------------------------------------------------------//
function sortChildren ( a, b ) {

    if (( a.order !== null ) && ( b.order !== null )) {
        return a.order - b.order;
    }
    return ( a.key && b.key && ( a.key !== b.key )) ? a.key.localeCompare ( b.key ) : 0;
}
