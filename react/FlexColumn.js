// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { Flex }     from './Flex.js';
import React        from 'react';

//================================================================//
// FlexColumn
//================================================================//
export const FlexColumn = ({ children, ...props }) => {

    return (
        <Flex
            direction   = 'column'
            { ...props }
        >
            { children }
        </Flex>
    );
};
