const sharp = require('sharp');
const chokidar = require('chokidar');
 
// original image
let originalImage = 'image.jpg';

// file name for cropped image
let outputImage = './croppedImages/croppedImage';
let width = 835;
let height = 1150;

var watcher = chokidar.watch('./images', {ignored: /^\./, persistent: true});


watcher
  .on('add', function(path) {
      console.log('File', path, 'has been added');
      for(let i=0; i<=2; i++){
        for(let j=0; j<=2; j++){
            sharp(path).extract({ width: width, height: height, left: width * i, top: height * j }).toFile(outputImage + i + j + ".jpg")
            .then(function(new_file_info) {
                console.log("Image cropped and saved");
            })
            .catch(function(err) {
                console.log(err);
            });
        }
    }
})




