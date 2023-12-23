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

// Recursive function to process uploaded files
async function processUploadedFiles(
  files: Express.Multer.File[],
  currentIndex: number,
  dimensionInfo: DimensionInfoProp,
  manipulatedCanvases: HTMLCanvasElement[], // Pass the array as an argument
  callback: (resultCanvas: HTMLCanvasElement[]) => void
) {

  try {
    
  if (currentIndex >= files.length) {
    // All files processed, invoke the callback
    callback(manipulatedCanvases); // Pass the manipulatedCanvases array
    return;
  }

  const file = files[currentIndex];

  // Load the uploaded file
  const image = await loadImage(file.path);
  const originalHeight = image.height;
  const originalWidth = image.width;
  let desiredWidth = dimensionInfo.width || originalWidth; 
  let desiredHeight = dimensionInfo.height || originalHeight;

  // Calculate the aspect ratio of the image
  // const aspectRatio = image.width / image.height;

  // Set the desired width for resizing (e.g., 800 pixels)
  // const desiredWidth = dimensionInfo.width;
  console.log("dimensionInfo.width", dimensionInfo);
  // Calculate the corresponding height to maintain aspect ratio
  // const desiredHeight = Math.round(desiredWidth / aspectRatio);

  if (dimensionInfo.maintainAspect && desiredWidth > 0) {
    const aspectRatio =  desiredWidth / originalWidth;
    // const aspectRatio = (originalHeight*desiredWidth)/originalWidth; //(oldHeight * newWidth) / oldWidth
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

  // Store the manipulated canvas in the array
  manipulatedCanvases.push(resizedCanvas);

  // Delete the file
  fs.unlink(file.path, err => {
    if (err) {
      console.error(err);
    }
  });
  
  // Continue processing the next file
  processUploadedFiles(files, currentIndex + 1, dimensionInfo, manipulatedCanvases, callback);

} catch (error) {
  console.error('Error processing uploaded files:', error);
  // Handle the error or rethrow it if you want the route handler to catch it
  throw error;    
}

}

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

    const quality = qualityParam ? parseInt(qualityParam, 10) : 90;

    const imageFormat = getValidImageFormat(imageFormatParam);

    const dimensionInfo: DimensionInfoProp = {
      maintainAspect: aspectParam === 'true',
      width: parseInt(widthParam),
      height: parseInt(heightParam),
      colorParam,
      imageFormatParam
    }

    // An array to store manipulated canvases
    const manipulatedCanvases: HTMLCanvasElement[] = [];
    
    // Process all uploaded files using a loop
    processUploadedFiles(uploadedFiles, 0, dimensionInfo, manipulatedCanvases, async (manipulatedCanvases) => {

      try {

        const savedImages = await Promise.all(
          manipulatedCanvases.map((canvas, i) => {
    
            const fileName = `filtered.${Math.floor(Math.random() * 2000)}.${imageFormat}`;
    
            const filePath = `/tmp/${fileName}`;
          
            return saveCanvasToImage(canvas, filePath, quality, imageFormat);
  
          })
        );
    
        res.status(200).json({files: savedImages });

      } catch (error:any) {

        console.log(error);

        res.status(400).send('Error manipulating images');
      }

    })


  } catch (error:any) {
    
    console.error('Error in route handling logic:', error);
    // If there's an error, delete all uploaded files and return an error response
    req.files.forEach((file:any) => fs.unlinkSync(file.path));

    res.status(500).json({ error: 'Internal Server Error' });

  }

});

export default router;
