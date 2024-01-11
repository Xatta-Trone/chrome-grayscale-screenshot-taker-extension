'use strict';
var JSZip = require('jszip');

// screenshot files
let screenShotImageData = [];

const browserSize = {
  height: window.innerHeight,
  width: window.innerWidth,
  verticalSections: Math.ceil(document.body.scrollHeight / window.innerHeight),
};

var colorExtension = {
  divId: 'extension-capture-div',
  button1Id: 'extension-capture-button',
  button2Id: 'extension-capture-button2',
  btnEl: () => {
    document.body.style.position = 'relative';
    const div = document.createElement('div');
    div.id = colorExtension.divId;
    div.setAttribute(
      'style',
      'display:block; margin-top:10px;text-align:center;position:sticky;bottom:20px;left:100%;transform:translateX(-10%);z-index:99999;max-width:10%;'
    );

    const button = document.createElement('button');
    button.id = colorExtension.button1Id;
    button.innerText = 'Change elements';
    button.setAttribute(
      'style',
      'padding:14px 25px; color:white; background: #242424;margin-bottom: 10px; '
    );
    const button2 = document.createElement('button');
    button2.id = colorExtension.button2Id;
    button2.innerText = 'Take screenshots';
    button2.setAttribute(
      'style',
      'padding:14px 25px; color:white; background: #242424;'
    );

    div.appendChild(button);
    div.appendChild(button2);

    return div;
  },
  initExtensionBtn: () => {
    const div = colorExtension.btnEl();
    document.body.appendChild(div);
    document
      .getElementById(colorExtension.button1Id)
      .addEventListener('click', () => {
        // apply filter
        colorExtension.applyFiltersAndChangeMedia();
        // replace text
        colorExtension.replaceTexts();
        // colorExtension.changeText(document.body.querySelectorAll('*'));
        // replace bg images
        colorExtension.replaceBgImages();
        // replace buttons
        colorExtension.replaceButtons();
      });
    document
      .getElementById(colorExtension.button2Id)
      .addEventListener('click', () => {
        // init screenshot image data
        screenShotImageData = [];
        // start taking screenshots
        colorExtension.takeScreenshots();
      });
  },

  takeScreenshots: () => {
    let p = new Promise((resolve, reject) => {
      window.scrollTo(0, 0);
      document.getElementById(colorExtension.divId).style.visibility = 'hidden';
      resolve();
    });
    p.then((e) => {
      for (let index = 0; index <= browserSize.verticalSections; index++) {
        setTimeout(() => {
          window.scrollTo(0, index * window.innerHeight);
          chrome.runtime.sendMessage(
            { type: 'TAKE_SCREENSHOT' },
            (response) => {
              // console.log(response);
              screenShotImageData.push(response.img);
            }
          );
        }, 550 * (index + 1));
      }
    }).then((e) => {
      setTimeout(() => {
        // filter unique blobs
        screenShotImageData = screenShotImageData.filter((e) => e);
        // screenShotImageData = [...new Set(screenShotImageData)];
        console.log(screenShotImageData.length, browserSize.verticalSections);
        document.getElementById(colorExtension.divId).style.visibility =
          'visible';
        colorExtension.downloadZip();
      }, (browserSize.verticalSections + 1) * 550 + 1000);
    });
  },

  downloadZip: () => {
    var zip = new JSZip();
    var imgZip = zip.folder('images');

    for (let index = 0; index < screenShotImageData.length; index++) {
      imgZip.file(
        `img${index + 1}.png`,
        colorExtension.b64toBlob(screenShotImageData[index]),
        {
          base64: true,
        }
      );
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, 'screenshots.zip');
    });

    function saveAs(blob, fileName = 'pic') {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  },

  b64toBlob: (b64Data, contentType = 'image/png', sliceSize = 512) => {
    b64Data = b64Data.replaceAll('data:image/png;base64,', '');
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  },

  applyFiltersAndChangeMedia: () => {
    // apply grayscale
    let html = document.getElementsByTagName('html')[0];
    html.setAttribute(
      'style',
      `-moz-filter: grayscale(100%);-webkit-filter: grayscale(100%);filter: gray;filter: grayscale(100%);`
    );

    // replace images
    let images = document.getElementsByTagName('img');
    for (var i = 0; i < images.length; i++) {
      // console.log(images[i].clientHeight, images[i].clientWidth);
      images[
        i
      ].src = `https://placehold.co/${images[i].clientWidth}x${images[i].clientHeight}`;
      images[i].srcset = '';
      images[i].loading = 'eager';
      images[i].removeAttribute('decoding');
    }

    // replace videos
    let videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
      const videoEl = videos[i];
      videoEl.controls = false;
      videoEl.poster = `https://placehold.co/${videos[i].clientWidth}x${videos[i].clientHeight}?text=Video`;
      videoEl.autoplay = false;
      videoEl.loop = false;
      videoEl.load();
    }
  },

  replaceTexts: () => {
    // a,div element texts
    let tags2 = ['a'];
    let elements2 = [];
    tags2.forEach((tag) => elements2.push(...document.querySelectorAll(tag)));

    for (let index = 0; index < elements2.length; index++) {
      if (elements2[index].hasChildNodes()) {
        let children = Array.from(elements2[index].childNodes);
        children.forEach((e) => {
          // console.log(e, e.nodeType, e.nodeValue);
          if (
            e.nodeType == 3 &&
            e.nodeValue != undefined &&
            e.nodeValue.length > 0
          ) {
            // console.log(e.nodeValue.trim());
            e.nodeValue = colorExtension.replaceWithJibrish(e.nodeValue.trim());
          }
        });
      }
    }

    let tags = [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'label',
      'span',
      'td',
      'pre',
    ];
    let elements = [];

    tags.forEach((tag) => elements.push(...document.querySelectorAll(tag)));

    for (let index = 0; index < elements.length; index++) {
      if (elements[index].innerText.length > 0) {
        elements[index].innerText = colorExtension.replaceWithJibrish(
          elements[index].innerText
        );
      }
    }
  },

  replaceButtons: () => {
    let tags = [
      'button',
      '.btn',
      '[class*=btn]',
      'a[role=button]',
      'input[type=button]',
      'input[type=submit]',
      'input[type=reset]',
    ];
    let elements = [];

    tags.forEach((tag) => elements.push(...document.querySelectorAll(tag)));

    for (let index = 0; index < elements.length; index++) {
      if (
        elements[index].id !== colorExtension.button1Id &&
        elements[index].id !== colorExtension.button2Id
      ) {
        elements[index].innerText = 'Button';
        // if (elements[index].hasChildNodes()) {
        //   let children = Array.from(elements[index].childNodes);
        //   children.forEach((e) => {
        //     if (
        //       e.nodeType == 3 &&
        //       e.nodeValue != undefined &&
        //       e.nodeValue.length > 0
        //     ) {
        //       e.nodeValue = 'Button';
        //     }
        //   });
        // }
      }
    }
  },

  replaceWithJibrish: (originalText) => {
    const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Odio pellentesque diam volutpat commodo. Mauris cursus mattis molestie a iaculis at erat pellentesque. Potenti nullam ac tortor vitae purus faucibus ornare suspendisse sed. Nunc id cursus metus aliquam. Et malesuada fames ac turpis. Sed sed risus pretium quam vulputate dignissim suspendisse in. Leo duis ut diam quam nulla porttitor massa id neque. Etiam non quam lacus suspendisse faucibus interdum posuere. Eu consequat ac felis donec et odio pellentesque. Maecenas volutpat blandit aliquam etiam erat. At volutpat diam ut venenatis tellus in metus. Rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. At volutpat diam ut venenatis tellus in metus.
    A erat nam at lectus. Diam donec adipiscing tristique risus nec feugiat. Quam vulputate dignissim suspendisse in est ante. At elementum eu facilisis sed odio morbi quis. Non blandit massa enim nec dui nunc mattis enim. Maecenas accumsan lacus vel facilisis. Dis parturient montes nascetur ridiculus mus mauris vitae ultricies leo. Nisi lacus sed viverra tellus in hac. Egestas pretium aenean pharetra magna ac. Platea dictumst vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras.
    `;

    // let jibberLetters = loremIpsum.toLowerCase().replaceAll(/[^a-z]/g, '');
    // return Array.from(originalText)
    //   .map((char, index) => {
    //     const charIsLetter = char.match(/[a-zA-Z]/);
    //     if (charIsLetter) {
    //       const wasUpper = char === char.toUpperCase();
    //       const jibberLetter = jibberLetters[index % jibberLetters.length];
    //       return wasUpper ? jibberLetter.toUpperCase() : jibberLetter;
    //     } else {
    //       return char;
    //     }
    //   })
    //   .join('');

    let splitted = loremIpsum.split(' ');
    let textLength = originalText.length;
    let wordCount = originalText.split(' ').length;
    let replacedText = [];

    while (textLength > 0) {
      let word = splitted.shift();

      if (word == undefined) {
        splitted = loremIpsum.split(' ');
        word = splitted.shift();
      }

      // check for single word
      textLength = textLength - word.length - 1;
      replacedText.push(word);
    }

    return replacedText.join(' ');
  },

  replaceBgImages: () => {
    const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;
    return Array.from(
      Array.from(document.querySelectorAll('*')).reduce((collection, node) => {
        let prop = window
          .getComputedStyle(node, null)
          .getPropertyValue('background-image');
        // match `url(...)`
        let match = srcChecker.exec(prop);
        if (match) {
          // console.log(node);
          // get image size
          colorExtension.loadImg(match[1]).then((data) => {
            node.style.backgroundImage = `url('https://placehold.co/${data.width}x${data.width}')`;
          });
          collection.add(match[1]);
        }
        return collection;
      }, new Set())
    );
  },

  changeText: (root) => {
    return Array.from(
      Array.from(root).reduce((collection, node) => {
        // console.log(node, node.nodeType, node.childNodes);

        if (node.nodeType != 3 && node.hasChildNodes()) {
          return colorExtension.changeText(node.childNodes);
        }

        if (node.nodeType == 3) {
          // console.log('3', node);
          node = colorExtension.replaceWithJibrish(node);
        }
        return collection;
      }, new Set())
    );
  },

  loadImg: (src, timeout = 500) => {
    var imgPromise = new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => {
        resolve({
          src: src,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = reject;
      img.src = src;
    });
    var timer = new Promise((resolve, reject) => {
      setTimeout(reject, timeout);
    });
    return Promise.race([imgPromise, timer]);
  },
};

colorExtension.initExtensionBtn();

