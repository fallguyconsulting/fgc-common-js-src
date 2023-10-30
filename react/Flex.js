// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import React        from 'react';

//================================================================//
// Flex
//================================================================//
export const Flex = ({ className, direction, justify, align, wrap, columnGap, rowGap, gap, style, children, ...props }) => {

    return (
        <div
            className = { className }
            style = {{
                alignItems:         align || 'normal',
                columnGap:          columnGap || gap,
                display:            'flex',
                flexDirection:      direction || 'row',
                flexWrap:           wrap || 'nowrap',
                justifyContent:     justify || 'flex-start',
                overflow:           'visible',
                rowGap:             rowGap || gap,
                ...style
            }}
            { ...props }
        >
            { children }
        </div>
    );
};
