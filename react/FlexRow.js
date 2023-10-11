// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { Flex }     from './Flex.js';
import React        from 'react';

//================================================================//
// FlexRow
//================================================================//
export const FlexRow = ({ children, ...props }) => {

    return (
        <Flex
            direction   = 'row'
            { ...props }
        >
            { children }
        </Flex>
    );
};
