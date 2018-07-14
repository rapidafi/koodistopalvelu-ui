### Koodistopalvelu UI

User interface for some public APIs providing codesets and classification information. Uses own passthru simple PHP APIs (read only; GET) as backend.

Original sources for codesets and classifications are:
- [Suomi.fi Koodistot](https://koodistot.suomi.fi/)
- [Opintopolku Koodistopalvelu](https://virkailija.opintopolku.fi/koodisto-service/swagger/index.html)
- [THL Koodistopalvelu](https://thl.fi/fi/web/tiedonhallinta-sosiaali-ja-terveysalalla/koodistopalvelu)

#### Frontend

A codeset browser with ability to copy visible (selected) values to clipboard.

###### Requirements

- NodeJS
    - yarn
    - grunt

###### Build & install

```sh
yarn
grunt build
```

```sh
cp -r dist/ [to wherever]
```

#### Backend

Backend is just a few PHP scripts that pass thru HTTP calls to named original APIs basically to avoid CORS but also makes some simplifications.

###### Requirements

- PHP
    - php-xml
    - php-soap

###### Build & install

TODO
