const express = require('express');
const app = express();
const db = require('./db');
const s3 = require('./s3');
// const { getLabels } = require("./aws-img-reg");
// const moment = require("moment");
app.use(express.static('public'));
const config = require('./config.json');
app.use(express.json()); //Need this otherwise the req.body is empty
app.use(express.urlencoded({ extended: true }));

////// Boiler Plate for Upload

const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152,
    },
});

///// Routes

app.get('/images', (req, res) => {
    Promise.all([db.getImageDetails(), db.countNumberImages()])
        .then((images) => {
            // console.log("this is the result", images);
            res.json(images);
        })
        .catch((e) => {
            console.log('error in GET request', e);
        });
});

app.get('/extrascroll/:id', (req, res) => {
    // console.log("getting more images - serverside!");
    // console.log("lastId(serverside): ", req.params.id);
    db.getMoreImages(req.params.id)
        .then((returnedQuery) => {
            // console.log(
            //     "AFTER EXTRASCROLL returnedQuery.rows: ",
            //     returnedQuery.rows
            // );
            res.json(returnedQuery.rows);
        })
        .catch((e) => console.log('error: ', e));
});
app.get('/modal/:id', (req, res) => {
    Promise.all([
        db.getImageForModal(req.params.id),
        db.getComments(req.params.id),
        db.getOtherId(req.params.id),
    ])

        .then((result) => {
            res.json(result);
        })
        .catch((e) => {
            console.log('error in GET request', e);
        });
});

// add all the image upload boilerplate code above

app.post('/upload', uploader.single('file'), s3.upload, (req, res) => {
    // gives you access to your file
    console.log('file: ', req.file);
    console.log('input: ', req.body.title);
    console.log('input: ', req.body.description);
    console.log('input: ', req.body.username);
    // gives you access to the user input
    console.log('user input: ', req.body);

    // you'll eventually want to make a db insert here for all the info!
    if (req.file && req.body) {
        //make a db query to insert here all the information
        db.insertFile(
            config.s3Url + req.file.filename,
            req.body.username,
            req.body.title,
            req.body.description
        )
            .then((returnedQuery) => {
                console.log('returnedQuery: ', returnedQuery);
                // send back object represening the new image back to the client with res.json
                // The client can then add it to the images area and make it visible (images are in an array, so see how to use it, unshift)
                res.json(returnedQuery.rows[0]);
            })
            .catch((e) => console.log('e: ', e));
    } else {
        res.json({
            success: false,
        });
    }
});

app.post('/modal/:id', (req, res) => {
    console.log('post req.body', req.body);
    const { commentUsername, comment, imageId } = req.body;
    // const { imageId } = req.params;
    db.addComment(comment, commentUsername, imageId)
        .then((result) => {
            console.log('add comment result', result.rows);
            res.json(result.rows[0]);
        })
        .catch((e) => {
            console.log('err in comment post: ', e);
        });
});

app.post('/remove/:id', (req, res) => {
    console.log('req.params', req.params);
    var { id } = req.params;
    db.removeComment(id)
        .then((result) => {
            res.json(result.rows[0]);
        })
        .catch((e) => {
            console.log('err in remove comment: ', e);
        });
});
app.get('/delete/:id', (req, res) => {
    console.log('req.params', req.params);
    var { id } = req.params;
    db.deleteComments(id).then(
        db.deleteImage(id).then((result) => {
            res.json(result.rows[0]);
        })
    );
});

// app.get("/get-labels", (req, res) => {
//     console.log("getting labels from aws");
//     console.log("req.query.filename: ", req.query.filename);
//     getLabels(req.query.filename)
//         .then((labels) => {
//             res.json(labels);
//             console.log("labels: ", labels);
//         })
//         .catch((err) => console.log("err in get labels: ", err));
// });

app.listen(8080, () => console.log('IB server is listening on port :8080'));

/* notes on lecture
no need to use res.render. 
we have demoted the server from render. 
vue is doing the rendring. 
server is now only middle man to get data from database to vue. 
res.json is what we use now.
axios: whatever response it gets from the server it always ads it to data. 
q: does it ad or overwrite. res.data is always where we look for it. 
*/
