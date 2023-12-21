require('dotenv').config(); // Load environment variables from .env file

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import db from './database';
import uploadRouter from './routes/uploads'
import downloadRouter from "./routes/downloads";
const app = express();
const PORT = process.env.PORT || 5000;

let srcPath = 'src'

if (process.env.NODE_ENV === 'production'){
    srcPath = 'dist' 
}

// console.log("process.env.NODE_ENV", process.env.NODE_ENV);

app.use(express.static(`${srcPath}/utils/tmp`));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cors middleware
app.use(cors());

// // Define your routes here
// app.get('/', async (req, res) => {
//   const data = await db.select().from('my_table');
//   res.send(data);
// });

app.use('/upload', uploadRouter);
app.use('/download', downloadRouter);


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
