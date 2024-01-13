'use strict';
var JSZip = require('jszip');

// screenshot files
let screenShotImageData = [];
let scrollPosition = 0;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == 'TOGGLE_MENU') {
    colorExtension.toggleBtnVisibility();
  }
});

var colorExtension = {
  divId: 'extension-capture-div',
  button1Id: 'extension-capture-button',
  button2Id: 'extension-capture-button2',
  button3Id: 'extension-close-button',
  btnEl: () => {
    // document.body.style.position = 'relative';
    const div = document.createElement('div');
    div.id = colorExtension.divId;
    div.setAttribute(
      'style',
      'display:none; margin-top:10px;text-align:center;position:sticky;bottom:20px;left:100%;transform:translateX(-10%);z-index:99999;max-width:10%;'
    );

    const button = document.createElement('button');
    button.id = colorExtension.button1Id;
    button.innerText = 'Change elements';
    button.setAttribute(
      'style',
      'padding:14px 25px; color:white; background: #242424;margin-bottom: 10px;cursor: pointer;'
    );
    const button2 = document.createElement('button');
    button2.id = colorExtension.button2Id;
    button2.innerText = 'Take screenshots';
    button2.setAttribute(
      'style',
      'padding:14px 25px; color:white; background: #242424;cursor: pointer;'
    );

    const button3 = document.createElement('button');
    button3.innerHTML = '&times;';
    button3.id = colorExtension.button3Id;
    button3.setAttribute(
      'style',
      'font-size: 27px;position: absolute;top: 0;right: 0;border: 2px solid #242424;cursor: pointer; text-align: center;padding: 3px 8px; margin:0;color:white; background: #242424;'
    );
    button3.onclick = () => colorExtension.toggleBtnVisibility(false);

    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);

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
        // colorExtension.replaceTexts();
        colorExtension.changeAllTextRecursively(document.body);
        // colorExtension.changeAnchorTagTexts();
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
    scrollPosition = 0;
    colorExtension.toggleBtnVisibility(false);
    window.scrollTo(0, 0);
    setTimeout(() => {
      colorExtension.takeScreenshots2();
    }, 10);
  },

  toggleBtnVisibility: (forceVisibility = true) => {
    let el = document.getElementById(colorExtension.divId);
    // console.log(window.getComputedStyle(el, null).getPropertyValue('display'));

    if (forceVisibility == false) {
      el.style.display = 'none';
      return;
    }

    if (
      window.getComputedStyle(el, null).getPropertyValue('display') == 'block'
    ) {
      el.style.display = 'none';
    } else {
      el.style.display = 'block';
    }
  },
  takeScreenshots2: () => {
    chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' }, (response) => {
      // console.log(response);
      screenShotImageData.push(response.img);
      scrollPosition += window.innerHeight;
      window.scrollTo(0, scrollPosition);
      if (scrollPosition < document.body.scrollHeight) {
        setTimeout(colorExtension.takeScreenshots2, 500);
      } else {
        // console.log(screenShotImageData);
        colorExtension.toggleBtnVisibility();
        colorExtension.downloadZip();
      }
    });
  },

  downloadZip: () => {
    if (screenShotImageData.length == 0) {
      return alert('An error occurred while taking screenshots');
    }

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
    // console.log('total images', images.length);
    for (var i = 0; i < images.length; i++) {
      // console.log(images[i].clientHeight, images[i].clientWidth);
      images[i].srcset = '';
      images[i].loading = 'eager';
      images[i].removeAttribute('decoding');
      images[i].removeAttribute('srcset');
      images[i].removeAttribute('data-srcset');
      images[i].removeAttribute('data-src');
      images[i].setAttribute(
        'src',
        `https://placehold.co/${images[i].clientWidth}x${images[i].clientHeight}`
      );
    }

    // replace pictures
    let pictures = document.getElementsByTagName('picture');
    // console.log('total picture', pictures.length);
    for (var i = 0; i < pictures.length; i++) {
      var imgElement = pictures[i].querySelector('img');

      let imgUrl = '';

      if (imgElement) {
        imgElement.setAttribute(
          'src',
          `https://placehold.co/${imgElement.clientWidth}x${imgElement.clientHeight}`
        );
        imgElement.loading = 'eager';
        imgElement.removeAttribute('decoding');
        imgElement.removeAttribute('srcset');
        imgElement.removeAttribute('data-srcset');
        imgElement.removeAttribute('data-src');
        imgUrl = `https://placehold.co/${imgElement.clientWidth}x${imgElement.clientHeight}`;
      }

      var sourceElements = pictures[i].querySelectorAll('source');
      sourceElements.forEach(function (source) {
        source.setAttribute('srcset', imgUrl);
        source.setAttribute('src', imgUrl);
        source.setAttribute('data-srcset', imgUrl);
        source.setAttribute('data-src', imgUrl);
      });
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

  changeAllTextRecursively: (element) => {
    // Check if the element is not a script or style element
    if (
      element.tagName !== 'SCRIPT' &&
      element.tagName !== 'STYLE' &&
      element.tagName !== 'BUTTON'
    ) {
      // Update the text content of the element
      element.childNodes.forEach(function (node) {
        if (node.nodeType === 3) {
          // Text node
          node.textContent = colorExtension.replaceWithJibrish(
            node.textContent.trim()
          );
        } else if (node.nodeType === 1) {
          // Element node
          // Recursively call the function for child elements
          colorExtension.changeAllTextRecursively(node);
        }
      });
    }
  },

  changeAnchorTagTexts: () => {
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
  },

  checkEmailOrLink: (inputString) => {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const linkPattern =
      /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/;

    if (emailPattern.test(inputString)) {
      return true;
    } else if (linkPattern.test(inputString)) {
      return true;
    } else {
      return false;
    }
  },

  replaceButtons: () => {
    let tags = [
      'button',
      '.btn',
      '[class*=btn]',
      'a[role=button]',
      'span[role=button]',
      'input[type=button]',
      'input[type=submit]',
      'input[type=reset]',
    ];
    let elements = [];

    tags.forEach((tag) => elements.push(...document.querySelectorAll(tag)));

    for (let index = 0; index < elements.length; index++) {
      if (
        elements[index].id !== colorExtension.button1Id &&
        elements[index].id !== colorExtension.button2Id &&
        elements[index].id !== colorExtension.button3Id
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
            node.style.backgroundImage = `url(https://placehold.co/${data.width}x${data.width})`;
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

