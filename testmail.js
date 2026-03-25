const express = require('express');

const fs = require('fs');

const app = express();

app.use(express.json());

let array = [
  { name: 'some', age: '23', id: '1' },
  { name: 'someone', age: '33', id: '2' },
  { name: 'someone', age: '33', id: '3' },
  { name: 'someone', age: '33', id: '4' },
  { name: 'someone', age: '27', id: '5' },

]

const isFolderThere = fs.existsSync('dummy');

if (!isFolderThere) {
  fs.mkdirSync('dummy');
}


const multer = require('multer');

const whereStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'dummy/dummy');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
})

const uploadFile = multer({storage: whereStorage})


const mongoose = require('mongoose');

const connectDb = async () => {
  try { // studentDummyDatabase - database name we can give anything if we want
    await mongoose.connect('mongodb://127.0.0.1:27017/studentDummyDatabase', { // mongodb://127.0.0.1:27017/ mongodb url 
      useNewUrlParser: true, // this for url supports
      useUnifiedTopology: true, // this for connecting stability
    })
    console.log('db connected successfully');

  } catch (error) {
    console.log('db not connected throw an error');

  }
}
connectDb();


const stu = require('../backend/DummyTestModel/stumodel');


app.post('/add', uploadFile.single('imgMine'), async (req, res) => {
  try {
    const { nameOne, ageOne } = req.body;
    const img = req.file ? req.file.filename : null;
    const dataToSend = {
      name: nameOne,
      age: ageOne,
      imgMine: img
    }

    const Student = new stu(dataToSend);
    await Student.save()
    res.json({ message: 'successfully added', Student })

  } catch (error) {
    console.log(error.errors);

    const err = {};

    if (error.name === "ValidationError") {
      for (let field in error.errors) {
         err[field] = error.errors[field].message;
      }
     return res.status(400).json({message: 'validation error occur', err: err});
    }   
    
   return res.status(500).json(error);
  }

})

app.get('/', async (req, res) => {
  try {
     const data = await stu.find();

     res.json(data);
    
  } catch (error) {
    res.status(500).json({error: error});
  }
})

app.get('/:id', async(req, res) => {

});




app.post('/array-insert', (req, res) => {
  try {
    const { nameOne, ageOne, idOne } = req.body;

  const studentDetail = {
    name: nameOne,
    age: ageOne,
    id: idOne
  }
  array.push(studentDetail);
  console.log(array);

  res.send({ message: 'successfully sent', data: studentDetail });
  } catch (error) {
    
  }
});

app.get('/array-insert', (req, res) => {
  res.json(array);
})

app.get('/array-ins/:id', (req, res) => {
  const oneDetail = array.find((v) => v.id == req.params.id);
  console.log(oneDetail);
  if (oneDetail) {
    const sendDetail = { message: 'get one detail successfully', data: oneDetail };
    res.json(sendDetail);
  } else {
    console.log('can found the page of one detail');
    res.json({ error: 'i think the page is not found' });

  }


})

app.delete('/studentDelete/:id', (req, res) => {
  const { id } = req.params;

  const findedIndex = array.findIndex((v) => v.id === id);

  if (findedIndex !== -1) {
    const deletedarray = array.splice(findedIndex, 1);
    res.send({ message: 'deleted successfully', data: deletedarray });
  } else {
    res.json({ error: 'page not found' });
  }
})

app.put('/student/:id', (req, res) => {
  const { id } = req.params;
  const index = array.findIndex((v) => v.id === id);
  const { idOne, nameOne, ageOne } = req.body;
  const updateData = {
    id: idOne,
    name: nameOne,
    age: ageOne
  }
  if (index !== -1) {
    array[index] = { ...array[index], ...updateData };
    res.json({ mess: "updated successfully", data: array[index] })
  } else {

    res.status(404).json({ error: "can't update file check it" })
  }



})



app.listen(3500, () => {
  console.log('server is running successfully');

})