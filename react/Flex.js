// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import React        from 'react';

//================================================================//
// Flex
//================================================================//
export const Flex = ({ className, direction, justify, align, columnGap, rowGap, gap, style, children, ...props }) => {

    return (
        <div
            className = { className }
            style = {{
                display:            'flex',
                flexDirection:      direction || 'row',
                justifyContent:     justify || 'flex-start',
                alignItems:         align || 'normal',
                columnGap:          columnGap || gap,
                rowGap:             rowGap || gap,
                ...style
            }}
            { ...props }
        >
            { children }
        </div>
    );
};
