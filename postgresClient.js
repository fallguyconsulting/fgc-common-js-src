/* eslint-disable no-whitespace-before-property */

// import { Client as PGClient }       from 'pg';

// ( async () => {
//     try {
//         const pgClient = new PGClient ({
//             host:       'localhost',
//             port:       5432,
//             user:       'root',
//             password:   'password',
//             database:   '2cents',
//         });
//         await pgClient.connect ();
//         const res = await pgClient.query ( 'SELECT $1::text as message', [ 'Hello world!' ]);
//         console.log ( res.rows [ 0 ].message );
//         await pgClient.end ();
//     }
//     catch ( error ) {
//         console.log ( error );
//     }
// })();
