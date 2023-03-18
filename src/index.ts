import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './database';
import uploadRouter from './routes/uploads'

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('src/utils/tmp'));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cors middleware
app.use(cors());

// Define your routes here
app.get('/', async (req, res) => {
  const data = await db.select().from('my_table');
  res.send(data);
});

app.use('/upload', uploadRouter);


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
