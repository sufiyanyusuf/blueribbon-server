
const express = require('express');
var multer  = require('multer')
const {Storage} = require('@google-cloud/storage');
const crypto = require("crypto");
var fs = require("fs");

const uploadRouter = express.Router();

// Instantiate a storage client
const googleCloudStorage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_BUCKET,
  keyFilename: process.env.GCLOUD_KEY_FILE
});


// Multer is required to process file uploads and make them available via
// req.files.
const m = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});

// uploadRouter.route('/').get(async function (req, res) {
    
    const bucket = googleCloudStorage.bucket(process.env.GCLOUD_STORAGE_BUCKET);
    const file = bucket.file("br-logo.png");

//     // These options will allow temporary read access to the file
//     const options = {
//         version: 'v4',
//         action: 'upload',
//         expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//     };


//     // Get a v4 signed URL for reading the file
//     file.getSignedUrl(options, (err, res) => {
//         if (err) {
//           console.log(err);
//         }
//         console.log(res);
//       });
    


// });


// Process the file upload and upload to Google Cloud Storage.

uploadRouter.route('/productImage').post(m.single("file"), (req, res, next) => {

  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);

  // Make sure to set the contentType metadata for the browser to be able
  // to render the image instead of downloading the file (default behavior)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  blobStream.on("error", err => {
    console.log(err);
    next(err);
    return;
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

    // Make the image public to the web (since we'll be displaying it in browser)
    blob.makePublic().then(() => {
      res.status(200).send(`Success!\n Image uploaded to ${publicUrl}`);
    });
  });

  blobStream.end(req.file.buffer);

});

module.exports = uploadRouter;