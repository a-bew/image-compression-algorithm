import express from 'express';
import multer from 'multer';
import { compressImage, deleteFile, deleteLocalFiles, getValidImageFormat, saveCanvasToImage } from '../utils/utils';
import { createWriteStream } from 'fs';

import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';

import { createCanvas, loadImage } from 'canvas';

import fetch from 'node-fetch';

// const isImageURL = require('image-url-validator').default;
// import isImageURL from 'image-url-validator';

const router = express.Router();

const projectRoot = process.cwd();

const upload = multer({ dest: `${projectRoot}/uploads/` });

router.post('/', upload.array('files'), async (req:any, res:any) => {

    try {

      const compressedFiles: {size: number, compressedFile: string}[] = [];

      // Loop through each uploaded file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        // Compress the uploaded image
        const compressedFile = await compressImage(file.path);
        const stats = fs.statSync(compressedFile);
        const fileSizeInBytes = stats.size;
        const fileSizeInKilobytes = fileSizeInBytes;
        //  / 1024;
        compressedFiles.push({size: fileSizeInKilobytes, compressedFile});

          // Delete the file
        fs.unlink(file.path, err => {
          if (err) {
            console.error(err);
          }
        });
        
      }

      // All images are compressed, return a success response with the compressed file paths
      res.status(200).json({oldFiles: req.files, files: compressedFiles });

      // 4. deletes any files on the server on finish of the response      
      //  setTimeout(()=>deleteLocalFiles(compressedFiles), 2000) 

    } catch (error:any) {

      console.log("error", error.message);
      // If there's an error, delete all uploaded files and return an error response
      req.files.forEach((file:any) => fs.unlinkSync(file.path));
      res.status(500).send('Internal server error');

    }
});


type DimensionInfoProp = {
  maintainAspect: boolean,
  width: number,
  height: number,
  colorParam: string;
  imageFormatParam: string;
  blurImage: number;
  completeBlur: boolean;
}

// function applySpotlightEffect(ctx: CanvasRenderingContext2D, width: number, height: number, blurRadius: number) {
//   // Create a temporary canvas to hold the blurred image
//   // const tempCanvas = document.createElement('canvas');
//   const tempCanvas:any = createCanvas(width, height);

//   const tempCtx = tempCanvas.getContext('2d');
//   if (!tempCtx) return;

//   tempCanvas.width = width;
//   tempCanvas.height = height;

//   // Draw the original image onto the temporary canvas
//   tempCtx.drawImage(ctx.canvas, 0, 0);

//   // Apply blur effect to the temporary canvas
//   applyBlur(tempCtx, width, height, blurRadius);

//   // Clear the original canvas
//   ctx.clearRect(0, 0, width, height);

//   // Draw the blurred image onto the original canvas with a composite operation
//   ctx.globalCompositeOperation = 'lighter'; // Additive blending mode for glow effect
//   ctx.drawImage(tempCanvas, 0, 0);
// }

function completeBlur(ctx: CanvasRenderingContext2D, width: number, height: number, blurRadius: number) {
  const imageData = ctx.getImageData(0, 0, width, height);

  const pixels = imageData.data;

  // Set all channels (r,g,b,a) to the average color
  const avgColor = getAvgColor(imageData); 

  for(let i = 0; i < pixels.length; i += 4) {
    pixels[i] = avgColor.r;
    pixels[i + 1] = avgColor.g; 
    pixels[i + 2] = avgColor.b;
  }

  ctx.putImageData(imageData, 0, 0);

}

function getAvgColor(imageData: ImageData) {

  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;

  const totalPixels = imageData.width * imageData.height;
  const data = imageData.data;

  for(let i = 0; i < data.length; i += 4) {
    redSum += data[i];
    greenSum += data[i+1];
    blueSum += data[i+2];
  }

  const avgRed = Math.floor(redSum / totalPixels);
  const avgGreen = Math.floor(greenSum / totalPixels);  
  const avgBlue = Math.floor(blueSum / totalPixels);

  return {
    r: avgRed,
    g: avgGreen,
    b: avgBlue
  }; 
}

function applyBlur(ctx: CanvasRenderingContext2D, width: number, height: number, blurRadius: number) {
  // const imageData = ctx.getImageData(0, 0, width, height);
  // const pixels = imageData.data;

  // // Apply blur to each pixel
  // for (let i = 0; i < pixels.length; i += 4) {
  //   const avgR = getAverage(pixels, i, blurRadius, width, 'r');
  //   const avgG = getAverage(pixels, i, blurRadius, width, 'g');
  //   const avgB = getAverage(pixels, i, blurRadius, width, 'b');

  //   pixels[i] = avgR;
  //   pixels[i + 1] = avgG;
  //   pixels[i + 2] = avgB;
  // }

  // // Put the blurred image data back onto the canvas
  // ctx.putImageData(imageData, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          
          let red = 0, green = 0, blue = 0, alpha = 0;

          // box blur
          for(let n = -blurRadius; n <= blurRadius; n++) {
            for(let m = -blurRadius; m <= blurRadius; m++) {
              const pixelPos = (y + n) * (width * 4) + (x + m) * 4;
              red += pixels[pixelPos];
              green += pixels[pixelPos + 1];
              blue += pixels[pixelPos + 2];  
            }
          }

          red = red / ((blurRadius * 2 + 1) * (blurRadius * 2 + 1));
          green = green / ((blurRadius * 2 + 1) * (blurRadius * 2 + 1));
          blue = blue / ((blurRadius * 2 + 1) * (blurRadius * 2 + 1));

          const idx = (y * width + x) * 4;

          pixels[idx] = red;
          pixels[idx + 1] = green; 
          pixels[idx + 2] = blue;
        }
      }

      ctx.putImageData(imageData, 0, 0);
}

// Reusable function for converting image data to grayscale
function applyGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    pixels[i] = avg;
    pixels[i + 1] = avg;
    pixels[i + 2] = avg;
  }

  ctx.putImageData(imageData, 0, 0);
}


function blurImage(ctx:CanvasRenderingContext2D, width: number, height: number, radius: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Apply blur to each pixel
  for (let i = 0; i < pixels.length; i += 4) {
    const avgR = getAverage(pixels, i, radius, width, 'r');
    const avgG = getAverage(pixels, i, radius, width, 'g');
    const avgB = getAverage(pixels, i, radius, width, 'b');

    pixels[i] = avgR;
    pixels[i + 1] = avgG;
    pixels[i + 2] = avgB;
  }

  // Put the blurred image data back onto the canvas
  ctx.putImageData(imageData, 0, 0);
}

function getAverage(
    // pixels, i, radius, width, color
    pixels: Uint8ClampedArray,
    i: number,
    radius: number,
    width: number,
    color: 'r' | 'g' | 'b'
  ) {
  let sum = 0;
  let count = 0;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      const pixelIndex = (i + y * width * 4 + x * 4);
      const pixelColor = pixels[pixelIndex];
      
      if (color === 'r') {
        sum += pixelColor;
      } else if (color === 'g') {
        sum += pixelColor;
      } else if (color === 'b') {
        sum += pixelColor;
      }

      count++;
    }
  }

  return sum / count;
}

type CallbackFunction = (resultCanvases: HTMLCanvasElement[], error?: any) => void;

// Recursive function to process uploaded files
async function processUploadedFiles(
  files: Express.Multer.File[],
  currentIndex: number,
  dimensionInfo: DimensionInfoProp,
  manipulatedCanvases: HTMLCanvasElement[], // Pass the array as an argument
  callback: CallbackFunction
) {

  try {
    
    if (currentIndex >= files.length) {
      // All files processed, invoke the callback
      callback(manipulatedCanvases); // Pass the manipulatedCanvases array
      return;
    }

    const file = files[currentIndex];

    try {
      // Load the uploaded file
    // Load the uploaded file
    const image = await loadImage(file.path);
    const originalHeight = image.height;
    const originalWidth = image.width;
    let desiredWidth = dimensionInfo.width || originalWidth; 
    let desiredHeight = dimensionInfo.height || originalHeight;

    

    if (dimensionInfo.maintainAspect && desiredWidth > 0) {
      const aspectRatio =  desiredWidth / originalWidth;
      desiredHeight = Math.round(originalHeight * aspectRatio); 
    }

    // Create a canvas with the desired dimensions
    const resizedCanvas:any = createCanvas(desiredWidth, desiredHeight);

    const ctx = resizedCanvas.getContext('2d');
  // Set high-quality image rendering for better sharpness
      // ctx.imageSmoothingEnabled = true;
      // ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        image, 
        0, 0, originalWidth, originalHeight,
        // 0, 0, desiredWidth, desiredHeight
    );

    // Sharpen image
    // ctx.filter = 'sharpen(1.5)';
    // Set the blur effect
    ctx.filter = 'blur(10px)'; // Adjust the blur radius as needed
    // Draw the image onto the resized canvas to resize it
    // ctx.drawImage(image, 0, 0, desiredWidth, desiredHeight);
    ctx.drawImage(
        image, 
        0, 0, originalWidth, originalHeight,
        0, 0, desiredWidth, desiredHeight
    );

    // Apply color transformation based on colorParam
    if (dimensionInfo.colorParam === 'grayscale') {
      applyGrayscale(ctx, desiredWidth, desiredHeight);
    }

    console.log("dimensionInfo", dimensionInfo, dimensionInfo.blurImage);
     
      if (dimensionInfo.completeBlur){
        completeBlur(ctx, desiredWidth, desiredHeight, dimensionInfo.blurImage)
      } else {
        dimensionInfo.blurImage > 0 && dimensionInfo.blurImage < 10 && applyBlur(ctx, desiredWidth, desiredHeight, dimensionInfo.blurImage)
      }

    // Store the manipulated canvas in the array
    manipulatedCanvases.push(resizedCanvas);

    // Delete the file
    fs.unlink(file.path, err => {
      if (err) {
        console.error(err);
      }
    });

    processUploadedFiles(files, currentIndex + 1, dimensionInfo, manipulatedCanvases, callback);

  } catch (loadImageError) {
    console.error('Error loading image:', loadImageError);

      // Handle the error or log it as needed
      // For example, you can skip the current file and continue processing the next one
      console.error(`Skipping file: ${file.originalname} due to unsupported image type.`);

      // Continue processing the next file
      // processUploadedFiles(files, currentIndex + 1, dimensionInfo, manipulatedCanvases, callback);
      callback([], loadImageError); 
  }
    // Continue processing the next file

} catch (error) {
  console.error('Error processing uploaded files:', error);
  // Handle the error or rethrow it if you want the route handler to catch it
  // throw error;   
   // Invoke the callback with the error
   callback([], error); 
}

}

class YourSpecificError extends Error {
  constructor() {
    super('Error manipulating images');
    this.name = 'YourSpecificError';
  }
}

const unlinkFile = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};
const upload1 = multer({ dest: `${projectRoot}/uploads/manipulate-images` });

router.post('/manipulate-images', upload1.array('files'), async (req:any, res:any) => {

  try {
    
    const uploadedFiles = req.files as Express.Multer.File[];
  
    // Get the quality parameter from the request query, default to 90 if not specified
    const qualityParam = req.query.quality as string;
    const imageFormatParam = req.query.imageFormat as string;
    const aspectParam = req.query.aspect as string;
    const widthParam = req.query.width as string;
    const heightParam = req.query.height as string;
    const colorParam = req.query.color as string;
    const blurImage = req.query.blurRatio as number;
    const completeBlur = JSON.parse(req.query.completeBlur);

    const quality = qualityParam ? parseInt(qualityParam, 10) : 90;

    const imageFormat = getValidImageFormat(imageFormatParam);

    const dimensionInfo: DimensionInfoProp = {
      maintainAspect: aspectParam === 'true',
      width: parseInt(widthParam),
      height: parseInt(heightParam),
      colorParam,
      imageFormatParam,
      blurImage,
      completeBlur
    }
    
    const manipulatedCanvases = await new Promise<HTMLCanvasElement[]>((resolve, reject) => {

      processUploadedFiles(uploadedFiles, 0, dimensionInfo, [], (resultCanvases, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(resultCanvases);
        }
      });
    });


        const savedImages = await Promise.all(
          manipulatedCanvases.map((canvas, i) => {
    
            const fileName = `filtered.${Math.floor(Math.random() * 2000)}.${imageFormat}`;
    
            const filePath = `/tmp/${fileName}`;
          
            return saveCanvasToImage(canvas, filePath, quality, imageFormat);
  
          })
        );
    
        res.status(200).json({success: true, files: savedImages });



  } catch (error:any) {
    
    console.error('Error in route handling logic:', error);
    // If there's an error, delete all uploaded files and return an error response
    // req.files.forEach((file:any) => fs.unlinkSync(file.path));
    req.files.forEach(async (file: any) => {
      await unlinkFile(file.path);
    });

    // res.status(500).json({ error: 'Internal Server Error' });

    // Customize the error response based on the type of error
    if (error instanceof YourSpecificError) {
      res.status(400).json({ error: 'Error manipulating images' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }

  }

});

export default router;
