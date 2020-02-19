// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import bluebird                     from 'bluebird';
import redis                        from 'redis';

bluebird.promisifyAll ( redis );

//----------------------------------------------------------------//
export function init ( host, port ) {

    this.client = redis.createClient ({
        host:   host,
        port:   port,
    });

    this.client.on ( 'error', ( err ) => {
        console.log ( 'ERROR: ', err );
    });
}
