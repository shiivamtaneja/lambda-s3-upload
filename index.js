const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const axios = require('axios');

const awsS3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
  },
});

exports.handler = async (event, context, callback) => {
  let result = null;

  try {
    const reqBody = event.body;

    if (
      !reqBody.body ||
      !reqBody.contentType ||
      !reqBody.key ||
      !reqBody.bucketName
    ) {
      console.log("Error: Got the following data:", reqBody);
      throw new Error('Attributes Missing');
    }

    const body = reqBody.body;
    const contentType = reqBody.contentType;
    const bucketName = reqBody.bucketName;

    const buffer = Buffer.from(body);

    const params = {
      Bucket: bucketName,
      Key: reqBody.key
    }

    const s3Command = new PutObjectCommand(params);

    const url = await getSignedUrl(awsS3Client, s3Command, { expiresIn: 3600 });

    await axios.put(url, buffer, {
      headers: {
        'Content-Type': contentType,
      }
    })

    result = url.split('?')[0];
  } catch (err) {
    callback(err)
  }
  return callback(null, result)
}