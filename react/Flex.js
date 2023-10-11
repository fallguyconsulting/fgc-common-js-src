// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import React        from 'react';

//================================================================//
// Flex
//================================================================//
export const Flex = ( props ) => {

    return (
        <div
            className = { props.className }
            style = {{
                display:            'flex',
                flexDirection:      props.direction || 'row',
                justifyContent:     props.justify || 'flex-start',
                alignItems:         props.align || 'normal',
                columnGap:          props.columnGap || props.gap,
                rowGap:             props.rowGap || props.gap,
                ...props.style
            }}
        >
            { props.children }
        </div>
    );
};
