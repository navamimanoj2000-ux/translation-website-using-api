# Language Translation Tool

A simple web-based translation tool built using HTML, CSS, and JavaScript.
This project uses the LibreTranslate API to translate text between different languages.

## Features

* Translate text between multiple languages
* Source and target language selection
* Responsive user interface
* Loading animation during translation
* Error handling for empty input and API failures
* Copy translated text option

## Technologies Used

* HTML
* CSS
* JavaScript
* LibreTranslate API

## Project Structure

```bash id="t2h9ab"
translation-tool/
│
├── app.html
├── app.css
├── app.js
└── README.md
```

## How to Run

1. Download or clone the project
2. Open the folder in VS Code
3. Run `app.html` using Live Server

or

Open `app.html` directly in a browser.

## API Used

LibreTranslate API:

https://libretranslate.com

## Known Issue

The public LibreTranslate server may sometimes fail or show:

```bash id="eq82zy"
All translation servers are busy
```

This happens because free public servers are often overloaded.

## Possible Fixes

* Retry after some time
* Use another LibreTranslate instance
* Host LibreTranslate locally
* Add backup translation APIs

## Future Improvements

* Voice translation
* Dark mode
* Translation history
* Auto language detection
* Speech-to-text support

## Author

Navami Manoj
