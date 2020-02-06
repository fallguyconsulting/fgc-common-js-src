// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import React, { Fragment, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link }                                                 from 'react-router-dom';
import AutoSizer                                                from 'react-virtualized-auto-sizer';
import { FixedSizeList, VariableSizeList }                      from 'react-window';
import { Dropdown, Grid, Icon, List, Menu, Card, Group }        from 'semantic-ui-react';

const CARD_PADDING = 0;
const ROW_MARGIN = 20; // TODO: would be nicer to get the scroll size dynamically

//================================================================//
// InfiniteScrollView
//================================================================//
export const InfiniteScrollView = ( props ) => {

    const { onGetCard, onGetSizerName, totalCards } = props;
    const onRowLimit = props.onRowLimit || false;

    if ( totalCards === 0 ) {
        return (
            <div/>
        );
    }

    const sizers = props.sizers || [ onGetCard ( 0 )];

    const sizerRefs = {};
    for ( let sizerName in sizers ) {
        sizerRefs [ sizerName ] = props.listRef || useRef ();
    }

    const [ rowWidth, setRowWidth ]         = useState ( 0 );
    const [ cardSizes, setCardSizes ]       = useState ( false );
    const [ rowMetrics, setRowMetrics ]     = useState ( false );
    const listRef                           = useRef ();

    useLayoutEffect (() => {

        if ( !cardSizes ) {

            const sizes = {};

            for ( let sizerName in sizerRefs ) {
                const sizerRef = sizerRefs [ sizerName ];
                if ( sizerRef.current ) {
                    sizes [ sizerName ] = {
                        width: sizerRef.current.offsetWidth + CARD_PADDING,
                        height: sizerRef.current.offsetHeight + CARD_PADDING,
                    };
                }
            }
            setCardSizes ( sizes );
        }
    });

    const recalculate = ( rowMetrics === false ) || ( rowMetrics.width != rowWidth ) || ( rowMetrics.totalCards != totalCards );

    if ( recalculate && cardSizes && ( rowWidth > 0 )) {

        const maxCardsPerRow = onRowLimit && onRowLimit ( rowWidth, cardSizes ) || 0;

        const rows = [];
        let fixedheight = true;
        let height = false;

        const nextRow = ( cardSize, i ) => {
            rows.push ({
                cards:      [ i ],
                width:      cardSize.width,
                height:     cardSize.height,
            });
        }

        const pushCard = ( cardSize, i ) => {
            const row = rows [ rows.length - 1 ];
            if ( !row ) return false;
            if ( row.height !== cardSize.height ) return false;
            if (( row.width + cardSize.width ) > rowWidth ) return false;
            if (( maxCardsPerRow > 0 ) && ( row.cards.length >= maxCardsPerRow )) return false;
            row.cards.push ( i );
            row.width += cardSize.width;
            return true;
        }

        for ( let i = 0; i < totalCards; ++i ) {
            const sizerName = onGetSizerName ? onGetSizerName ( i ) : 0;
            const cardSize = cardSizes [ sizerName ];
            if ( !cardSize ) continue;

            if ( !pushCard ( cardSize, i )) {
                nextRow ( cardSize, i );
            }

            if ( height === false ) {
                height = cardSize.height;
            }

            if ( height !== cardSize.height ) {
                fixedheight = false;
            }
        }

        setRowMetrics ({
            rows:           rows,
            width:          rowWidth,
            totalCards:     totalCards,
            fixedHeight:    fixedheight ? height : false,
        });
    }

    const getRowHeight = ( index ) => {
        return rowMetrics ? rowMetrics.rows [ index ].height : 0;
    }

    const onResize = ({ width, height }) => {
        if ( listRef.current ) {
            listRef.current.resetAfterIndex ( 0, false );
        }
        setRowWidth ( width - ROW_MARGIN );
    }

    const rowFactory = ( props ) => {

        const { index, style } = props;
        const row = rowMetrics.rows [ index ];

        let cards = [];
        for ( let cardID of row.cards ) {
            cards.push (
                <div
                    key = { cardID }
                    style = {{ display: 'inline-block' }}
                >
                    { onGetCard ( cardID )}
                </div>
            );
        }

        const rowHeight = getRowHeight ( index );

        return (
            <div
                style = { style }
            >
                <div style = {{
                    height: rowHeight,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                }}>
                    <div>
                        { cards }
                    </div>
                </div>
            </div>
        );
    }

    const sizerList = [];
    if ( !cardSizes ) {
        for ( let sizerName in sizers ) {
            sizerList.push (
                <div
                    key = { `sizer:${ sizerName }` } 
                    ref = { sizerRefs [ sizerName ]}
                    style = {{ visibility: 'hidden', float: 'left' }}
                >
                    { sizers [ sizerName ]}
                </div>
            );
        }
    }

    return (
        <Fragment>
            { sizerList }
            <AutoSizer
                onResize = { onResize }
            >
                {({ width, height }) => (
                    <div onClick = { props.onClick }>
                        <If condition = { rowMetrics }>
                            <Choose>

                                <When condition = { rowMetrics.fixedHeight !== false }>
                                    <FixedSizeList
                                        height = { height }
                                        itemCount = { rowMetrics.rows.length }
                                        itemSize = { rowMetrics.fixedHeight }
                                        width = { width }
                                    >
                                        { rowFactory }
                                    </FixedSizeList>
                                </When>

                                <Otherwise>
                                    <VariableSizeList
                                        ref = { listRef }
                                        height = { height }
                                        itemCount = { rowMetrics.rows.length }
                                        itemSize = { getRowHeight }
                                        width = { width }
                                    >
                                        { rowFactory }
                                    </VariableSizeList>
                                </Otherwise>

                            </Choose>
                        </If>
                    </div>
                )}
            </AutoSizer>
        </Fragment>
    );
}
