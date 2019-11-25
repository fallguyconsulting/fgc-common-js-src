import { InfiniteScrollView }                               from '../InfiniteScrollView';
import React, { useState, useRef, useLayoutEffect }         from 'react';
import { Dropdown, Grid, Icon, List, Menu, Card, Group }    from 'semantic-ui-react';

const CARD_MARGIN = 6;

function makeCard ( width, height, color ) {
    return (
        <svg width = { width } height = { height }>
            <rect width = { width - CARD_MARGIN } height = { height - CARD_MARGIN } fill = { color } stroke = "rgb( 0,0,0 )" strokeWidth = "3" />
        </svg>
    );
}

const cards = [
    makeCard ( 64, 64, 'orange' ),
    makeCard ( 194, 194, 'red' ),
    makeCard ( 194, 266, 'blue' ),
    makeCard ( 640, 480, 'green' ),
];

const cardArray = []; // sizerIDs

function pushCards ( count, type ) {
    for ( let i = 0; i < count; ++i ) {
        cardArray.push ( type );
    }
}

pushCards ( 5, 0 );
pushCards ( 3, 1 );
pushCards ( 7, 2 );
pushCards ( 10, 0 );
pushCards ( 7, 2 );
pushCards ( 12, 1 );
pushCards ( 5, 0 );
pushCards ( 3, 1 );
pushCards ( 7, 2 );
pushCards ( 1, 3 );

const getCard = ( i ) => {
    return cards [ cardArray [ i ]];
}

const getSizer = ( i ) => {
    return cardArray [ i ];
}

export const VariableRowScrollScreen = () => {
    return (
        <div style = {{ height: '100vh' }}>
            <InfiniteScrollView 
                onGetCard   = { getCard }
                sizers      = { cards }
                onGetSizer  = { getSizer }
                totalCards  = { cardArray.length }
            />
        </div>
    );
}