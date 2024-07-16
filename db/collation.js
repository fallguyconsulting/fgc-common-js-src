// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as util        from '../util';

//----------------------------------------------------------------//
function affirmCollationBranchRecurse ( scheme, row, node, context, depth ) {

    depth = depth || 0;
    node = node || {};

    util.affirmObjectField ( node, 'children', {});
    util.affirmObjectField ( node, 'row', row );
    util.affirmObjectField ( node, 'depth', depth );
    
    if ( depth >= scheme.length ) return;

    context = context || {};
    const key = scheme [ depth ] && scheme [ depth ]( row, context );
    if ( !key ) return;

    node = util.affirmObjectField ( node.children, key, {});
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
export function formatCollationTree ( format, node, context ) {
    return formatCollationTreeRecurse ( format, node || {}, context );
}

//----------------------------------------------------------------//
function formatCollationTreeRecurse ( format, node, context, nodeKey ) {

    const depth = node.depth;
    if ( !format [ depth ]) return;

    context = context || {};

    const children = Object.keys ( node.children ).sort ().map (( key ) => formatCollationTreeRecurse (
        format,
        node.children [ key ],
        context,
        key
    ));

    return format [ depth ]( node.row, nodeKey, children, context ); 
}
