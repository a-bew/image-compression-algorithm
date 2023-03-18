import express from 'express';
import multer from 'multer';
import { compressImage, deleteLocalFiles } from '../utils/utils';
import fs from 'fs';
import Jimp from 'jimp';

const isImageURL = require('image-url-validator').default;
// import isImageURL from 'image-url-validator';

const router = express.Router();

// const storage = multer.diskStorage({
//   destination: (req: any, file: any, cb: (arg0: null, arg1: string) => void) => {
//     cb(null, './uploads');
//   },
//   filename: (req: any, file: { originalname: any; }, cb: (arg0: null, arg1: string) => void) => {
//     const fileName = `${Date.now()}-${file.originalname}`;
//     cb(null, fileName);
//   }
// });

// const upload = multer({ storage });

// router.post('/', upload.array('images'), (req, res) => {
//   console.log(req.files);
//   res.send('Images uploaded successfully');
// });

const upload = multer({ dest: 'uploads/' });

  router.post('/', upload.array('files'), async (req:any, res:any) => {
  // console.log(req.files);
  // res.send('Images uploaded successfully');
  console.log("we are here");
  try {
    const compressedFiles: {size: number, compressedFile: string}[] = [];

    // Loop through each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Check if the uploaded file is an image
      // const isImage = await isImageURL(file.path);

      // if (!isImage) {
      //   // If the file is not an image, delete it and return an error response
      //   fs.unlinkSync(file.path);
      //   res.status(400).send(`File ${i + 1} is not an image`);
      //   return;
      // }

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



export default router;
