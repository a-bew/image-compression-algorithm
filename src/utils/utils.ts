import fs from "fs";
import Jimp = require("jimp");
import cron from 'node-cron'
import path from 'path';
import { PathLike } from 'fs';

import { createWriteStream } from 'fs';
import { Canvas } from "canvas";

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file

export async function compressImage(inputURL: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {

        const photo = await Jimp.read(inputURL);
      const outpath =
        "/tmp/filtered." + Math.floor(Math.random() * 2000) + ".jpg";

        
      await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(__dirname + outpath, (img) => {
          resolve(__dirname + outpath);
        });

        // Set a timeout to delete the file after 30 minutes
        setTimeout(() => {
            deleteFile(outpath);
        }, 4 * 60 * 1000);
        
    } catch (error) {
      reject(error);
    }
  });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files: Array<string>) {
  for (let file of files) {
    fs.unlinkSync(file);
  }
}

export function getFilename() {
    const timestamp = Date.now();
    return `filtered.${timestamp}.png`;
  }


// Function to delete the file
export function deleteFile(filename: string) {
    const filepath = path.join(__dirname, filename);
    fs.unlink(filepath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filename}:`, err);
      } else {
        console.log(`File ${filename} deleted successfully`);
      }
    });
  }


export async function saveCanvasToImage(canvas: any, filePath: string, quality: number, imageFormatParam: string) {

    const fullPath = path.join(__dirname, filePath);
    // const fullPath = `${__dirname}/${filePath}`;

    // Get the directory path without the filename
    const directoryPath = path.dirname(fullPath);

    try {

      // Check if the directory exists, and create it if it doesn't
      await fs.promises.mkdir(directoryPath, { recursive: true });

      const buffer = await canvas.toBuffer(`image/${imageFormatParam}`, {quality});
      
      const uint8Array = new Uint8Array(buffer);
    
      // Write to file first
      await fs.promises.writeFile(fullPath, uint8Array);
    
      // Then get a read stream
      const readStream = fs.createReadStream(fullPath);
    
      const stats = fs.statSync(fullPath);
      const size = stats.size;
     // Set a timeout to delete the file after 30 minutes

      setTimeout(() => {
          deleteFile(filePath);
      }, 4 * 60 * 1000);

      return {
        size,
        compressedFile: fullPath
      };
    
    } catch(error: any) {

      // Handle errors here
      console.error('Error saving canvas to image:', error);
      throw error; // Re-throw the error for further handling or logging

    }

}

export function getValidImageFormat(format: string): string {
  let validFormat: string;

  switch (format.toLowerCase()) {
    case 'png':
      validFormat = 'png';
      break;
    case 'jpeg':
    case 'jpg':
      validFormat = 'jpeg';
      break;
    case 'webp':
      validFormat = 'webp';
      break;
    default:
      // If the format is not recognized, return the default format (jpg)
      validFormat = 'jpeg';
      break;
  }

  return validFormat;
}

