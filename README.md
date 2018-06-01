# Voikko Node Web API

Use Voikko over HTTP

## Installing

1. Clone project
2. Run `npm install`
3. Copy `config.sample.js` to `config.js`
4. Run `npm install -g pm2`
5. Run `pm2 start index.js`


## Usage

### Analyze

GET `/analyze/kerrostalollakin`

=> 

```
[ { BASEFORM: 'kerrostalo',
    CLASS: 'nimisana',
    FOCUS: 'kin',
    FSTOUTPUT: '[Ln][Xp]kerros[X]kerro[Sn][Ny]s[Bh][Bc][Ln][Ica][Xp]talo[X]talo[Sade][Ny]lla[Fkin][Ef]kin',
    NUMBER: 'singular',
    POSSIBLE_GEOGRAPHICAL_NAME: 'true',
    SIJAMUOTO: 'ulkoolento',
    STRUCTURE: '=pppppp=pppppppppp',
    WORDBASES: '+kerros(kerros)+talo(talo)' } ]
```

## License

GPL v3 or later

This application uses [Voikko library](https://github.com/voikko/corevoikko) built from commit hash [9449717](https://github.com/voikko/corevoikko/commit/9449717c11ab60c0a637e7aa16ee7a9015b667d9) using Emscripten. Library has been built using standard [Voikko dictionary](https://www.puimula.org/htp/testing/voikko-snapshot-v5/) with commit hash ee00104.  

Voikko library located at `lib/libvoikko.js` is licensed under GNU GPL 2 or later.


