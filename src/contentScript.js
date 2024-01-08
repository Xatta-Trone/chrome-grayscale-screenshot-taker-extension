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
  buttonId: 'extension-capture-button',
  btnEl: () => {
    document.body.style.position = 'relative';
    const button = document.createElement('button');
    button.id = colorExtension.buttonId;
    button.innerText = 'Capture page';
    button.setAttribute(
      'style',
      'padding:14px 25px; color:white; background: #242424; display:block; margin-top:10px;text-align:center;position:sticky;bottom:20px;left:100%;transform:translateX(-10%);z-index:99999;max-width:10%;'
    );
    return button;
  },
  initExtensionBtn: () => {
    const button = colorExtension.btnEl();
    document.body.appendChild(button);
    button.addEventListener('click', () => {
      // init screenshot image data
      screenShotImageData = [];
      // apply filter
      colorExtension.applyFiltersAndChangeMedia();
      // replace text
      colorExtension.replaceTexts();
      // start taking screenshots
      colorExtension.takeScreenshots();
    });
  },

  takeScreenshots: () => {
    window.scrollTo(0, 0);
    document.getElementById(colorExtension.buttonId).style.visibility =
      'hidden';
    for (let index = 0; index <= browserSize.verticalSections; index++) {
      setTimeout(() => {
        window.scrollTo(0, index * window.innerHeight);
        chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' }, (response) => {
          console.log(response);
          screenShotImageData.push(response.img);
        });
      }, 550 * (index + 1));
    }

    setTimeout(() => {
      // filter unique blobs
      // screenShotImageData = [...new Set(screenShotImageData)];
      document.getElementById(colorExtension.buttonId).style.visibility =
        'visible';
      colorExtension.downloadZip();
    }, (browserSize.verticalSections + 1) * 550 + 1000);
  },

  downloadZip: () => {
    var zip = new JSZip();
    var imgZip = zip.folder('images');

    for (let index = 0; index < screenShotImageData.length; index++) {
      imgZip.file(
        `img${index}.png`,
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
      console.log(images[i].clientHeight, images[i].clientWidth);
      images[
        i
      ].src = `https://placehold.co/${images[i].clientWidth}x${images[i].clientHeight}`;
      images[i].srcset = '';
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
    let tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'span'];
    let elements = [];

    tags.forEach((tag) => elements.push(...document.getElementsByTagName(tag)));

    for (let index = 0; index < elements.length; index++) {
      elements[index].innerText = colorExtension.replaceWithJibrish(
        elements[index].innerText
      );
    }
  },

  replaceWithJibrish: (shape) => {
    const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean convallis eros porta commodo imperdiet. Integer ornare, diam gravida elementum aliquam, odio massa luctus augue, et egestas libero quam vitae justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nam et hendrerit nisl. Vivamus nec felis at magna lacinia consequat. Maecenas ut felis accumsan, rhoncus dolor nec, ullamcorper lorem. Aenean placerat, lacus et placerat aliquam, risus ipsum luctus nulla, a viverra nisl eros nec enim. Donec vitae libero est. Vivamus turpis tellus, commodo eu rhoncus id, imperdiet ut dui. Curabitur tincidunt diam ut erat sodales, quis sodales quam molestie. Nam non purus nisi. Nullam in ullamcorper ex. Vestibulum rhoncus non orci ac euismod. Duis at imperdiet ante. Mauris sed diam in metus semper posuere.
    Quisque ut neque dignissim, venenatis leo vel, interdum felis. Maecenas vehicula sagittis leo, vel commodo turpis lobortis vulputate. Interdum et malesuada fames ac ante ipsum primis in faucibus. Etiam a felis maximus, laoreet dolor eu, lacinia est. Suspendisse gravida lorem neque, ut efficitur eros euismod a. Suspendisse sit amet risus eget augue viverra tempus et vel metus. Aenean turpis tellus, cursus at elit ac, dictum accumsan ipsum. Integer porttitor tempor tellus, vel tincidunt massa. Sed feugiat, metus et cursus tincidunt, justo sapien dignissim risus, quis vulputate nisl tortor sit amet enim. Curabitur viverra sapien neque, a sodales purus lacinia ut. Vestibulum est turpis, blandit eu leo eu, facilisis condimentum tellus. Donec rhoncus rutrum vulputate.
    Cras hendrerit est non finibus placerat. Praesent iaculis auctor tellus, nec suscipit ligula placerat viverra. Curabitur maximus, massa et consequat ullamcorper, diam sem gravida diam, at scelerisque ex sapien nec mauris. Suspendisse sed ligula arcu. Quisque mattis eros a finibus finibus. Duis scelerisque lobortis est, ullamcorper varius arcu consequat et. Cras rhoncus ultrices fringilla. Aliquam a vestibulum sapien. Suspendisse sit amet tristique felis, eget molestie erat. Suspendisse bibendum arcu vestibulum vehicula gravida. Pellentesque a lacus in eros commodo luctus et ac risus. Quisque varius massa diam, quis congue odio sollicitudin eget.
    Aliquam consectetur sapien et enim dignissim, non dictum lectus elementum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc eu sodales lacus. Sed quis sodales metus, quis viverra metus. Vestibulum metus nunc, tempor sed pellentesque eget, fermentum at dolor. Fusce non cursus lectus. Mauris tincidunt fringilla felis non pretium. Sed semper vestibulum sagittis. Phasellus quis quam a metus viverra imperdiet. Ut euismod massa a vehicula consectetur. Integer vel sapien pulvinar, blandit nulla vel, efficitur sapien. Mauris feugiat purus mi, sit amet egestas tellus molestie eget. Proin ligula diam, mollis non ante in, hendrerit rhoncus enim. Aliquam quis ultricies metus. Curabitur quis nunc purus. Sed et mattis massa.
    Praesent luctus ornare metus, ac posuere erat bibendum et. Aliquam mattis turpis enim, vel suscipit diam maximus sed. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam tortor massa, imperdiet quis rhoncus nec, vehicula nec arcu. Aliquam a tempor elit. Aenean ut ultricies nisi, at vehicula risus. In eget erat risus. Sed hendrerit auctor purus, at sodales diam laoreet vel. Curabitur volutpat tempus sem. Vestibulum et mi dui. Morbi massa ex, tincidunt eu volutpat in, feugiat at libero. Etiam rhoncus orci sit amet tortor volutpat, ut viverra libero varius. Proin interdum sollicitudin est, id vestibulum libero auctor ac.`;
    let jibberLetters = loremIpsum.toLowerCase().replaceAll(/[^a-z]/g, '');

    return Array.from(shape)
      .map((char, index) => {
        const charIsLetter = char.match(/[a-zA-Z]/);
        if (charIsLetter) {
          const wasUpper = char === char.toUpperCase();
          const jibberLetter = jibberLetters[index % jibberLetters.length];
          return wasUpper ? jibberLetter.toUpperCase() : jibberLetter;
        } else {
          return char;
        }
      })
      .join('');
  },
};

colorExtension.initExtensionBtn();
