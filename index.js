const Libvoikko  = require( './lib/libvoikko.js' )();
const voikko     = Libvoikko.init( 'fi' );
const express    = require( 'express' );
const bodyParser = require( 'body-parser' );
let   config     = null;

try {
    config = require( './config.js' );
} catch ( ex ) {
    console.error( 'Failed to open config file. Make sure config.js exists.', ex );
    process.exit( 1 );
}

// Initialize Express
const app = express();

// Allow the use of POST body requests
app.use( bodyParser.json({ type: 'application/json' }) );

app.use( function( err, req, res, next ) {
    console.error( err );
});

app.get('/health', (req, res) => {
    res.status(200).json({ok: true});
});

app.get( '/analyze/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.analyze( req.params.word ) ) );
});

app.get( '/hyphenate/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.hyphenate( req.params.word ) ) );
});

app.get( '/grammarerrors/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.grammarerrors( req.params.word ) ) );
});

app.get( '/sentences/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.sentences( req.params.word ) ) );
});

app.get( '/spell/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.spell( req.params.word ) ) );
});

app.get( '/suggest/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.suggest( req.params.word ) ) );
});

app.get( '/tokens/:word', ( req, res ) => {
    res.send( JSON.stringify( voikko.tokens( req.params.word ) ) );
});

// This is the endpoint that is actually used in NGO.
app.post( '/voikkoize/search', ( req, res ) => {

    // Get the queried string from the POST body and tokenize it.
    let words = voikko.tokens( req.body.query );

    // Filter out anything else but words.
    words = words.map( word => {
        return word.type === 'WORD' ? word.text : false;
    }).filter( Boolean );

    // Analyze all words.
    const analyzed = words.map( ( word ) => {
        if ( voikko.analyze( word ).length > 0 ) {
            const res = voikko.analyze( word );

            return res.map( ( token ) => {
                token.ORIGINAL = word;
                return token;
            });
        }
        else {
            return [ {
                CLASS: 'not_changed',
                BASEFORM: word,
                ORIGINAL: word
            } ];
        }
    });

    // A list of common words we would like to ignore from the result.
    const ignoreList = [
        'olla',
        'voida',
        'tehdä',
        'pitää'
    ];

    // Do the real deal and make everything to be in baseform
    let result = analyzed.map( word => {
        if ( word.length === 1 ) {
            const base = word[0].BASEFORM.toLowerCase();
            const orig = word[0].ORIGINAL.toLowerCase();

            switch ( word[0].CLASS ) {

                // Ignore the word if it's irrelevant.
                case 'asemosana':
                case 'sidesana':
                case 'seikkasana':
                    return '~' + orig;
                default:
                    if ( base !== orig ) {
                        return base + ' ~' + orig;
                    }
                    else {
                        return base;
                    }
            }
        }
        else {
            const res = '(' + word.map( ( token ) => {
                switch ( token.CLASS ) {

                    // Ignore the word if it's irrelevant.
                    case 'asemosana':
                    case 'sidesana':
                    case 'seikkasana':
                        return '';
                    default:
                        return token.BASEFORM.toLowerCase();
                }
            }).filter( ( value, index, self ) => {

                // Filter out empty words.
                return value !== '';

            }).filter( ( value, index, self ) => {

                return self.indexOf( value ) === index;
            }).join( '|' ) + ')';

            if ( res.indexOf( word[0].ORIGINAL ) === -1 ) {
                return res + ' ~' + word[0].ORIGINAL;
            }
            else {
                return res;
            }
        }
    });

    // Filter out some common words
    result = result.filter( ( word ) => {
        return ignoreList.indexOf( word ) === -1;
    });

    res.send( result.join( ' ' ) );
});

app.post( '/voikkoize/index', ( req, res ) => {

    // Get the queried string from the POST body and tokenize it.
    let strings = voikko.tokens( req.body.query );

    // Filter out anything else but words.
    strings = strings.map( word => {
        return word.type === 'WORD' ? word.text : false;
    }).filter( Boolean );

    analyzed = strings.map( (word) => {
        const hyphenated = voikko.hyphenate(word).split('-');

        const permutations = [];

        for ( i = 0; i <= hyphenated.length; i++ ) {
            const short = hyphenated.slice( i, hyphenated.length );

            for ( j = 0; j <= short.length; j++ ) {
                permutations.push( short.slice( 0, j ).join('') )
            }
        }

        let unique = [ ...new Set(permutations) ];

        unique = unique.filter((perm) => {
            const analyzed = voikko.analyze( perm );

            return perm !== word ? analyzed.length > 0 : word;
        });

        let ret = unique.map( ( word ) => {
            if ( voikko.analyze( word ).length > 0 ) {
                const res = voikko.analyze( word );

                return res.map( ( token ) => {
                    token.ORIGINAL = word;
                    return token;
                });
            }
            else {
                return [ {
                    CLASS: 'not_changed',
                    BASEFORM: word,
                    ORIGINAL: word
                } ];
            }
        });

        return [ ...new Set(ret.flat()) ];
    });

    // A list of common words we would like to ignore from the result.
    const ignoreList = [
        'olla',
        'voida',
        'tehdä',
        'pitää',
        'sa'
    ];

    // Do the real deal and make everything to be in baseform
    let result = analyzed.map( word => {
        if ( word.length === 1 ) {
            const base = word[0].BASEFORM.toLowerCase();
            const orig = word[0].ORIGINAL.toLowerCase();

            if ( base !== orig ) {
                return base + ' ' + orig;
            }
            else {
                return base;
            }
        }
        else {
            const res = [
                ...word.map( w => w.BASEFORM.toLowerCase() ),
                ...word.map( w => w.ORIGINAL.toLowerCase() ),
            ];

            return [ ...new Set(res) ];
        }
    }).flat();

    // Filter out some common words and single letters
    result = result.filter( ( word ) => {
        return ignoreList.indexOf( word ) === -1 && word.length > 1;
    });

    res.send( result.join( ' ' ) );
});

app.listen( config.port, () =>
    console.log( 'Server started at port ' + config.port )
);
