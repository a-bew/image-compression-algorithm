import express from "express";
import path from 'path';
import { downloadImage } from "../utils/utils";

const router = express.Router();

router.get('/:image', async (req, res) => {
    
    const fileName = req.params.image as string;

    const url = `${process.env.VITE_APP_BACKEND_URL}/${fileName}`;
    
    console.log('url', url);
    
    try {

        downloadImage(res, fileName);

    } catch (error) {

      console.error('Failed to fetch and forward the file:', error);
      res.status(500).send('Internal Server Error');
      
    }
  });
  

  function getFileNameFromUrl(url:string) {
    return url.substring(url.lastIndexOf('/') + 1);
  }
  
  
export default router;
