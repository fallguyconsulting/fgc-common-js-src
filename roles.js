// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// STANDARD_ROLES
//================================================================//

export const STANDARD_ROLES = {
    ADMIN:          'admin',
    DEVELOPER:      'developer',
}

const ENTITLEMENT_SETS = {
    CAN_INVITE_USER:        [ STANDARD_ROLES.ADMIN, STANDARD_ROLES.DEVELOPER ],
}

//----------------------------------------------------------------//
function intersect ( a, b ) {

    for ( const x of a ) {
        if ( b.includes ( x )) return true;
    }
    return false;
}

//----------------------------------------------------------------//
export function canInviteUser ( roles ) {

    return intersect ( ENTITLEMENT_SETS.CAN_INVITE_USER, roles );
}