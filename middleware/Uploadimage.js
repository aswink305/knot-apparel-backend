const { S3 } = require('@aws-sdk/client-s3');
require('dotenv').config();
const multerS3 = require('multer-s3');
const multer = require('multer');

const AccessKeyId = process.env.AWS_S3_ACCESS_KEYID;
const SecretAccessKey = process.env.AWS_S3_SECRETACCESSKEY;
const bucket = process.env.AWS_S3_ACCESS_BUCKET_NAME;
// Configure AWS SDK
const awsS3 = new S3({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: AccessKeyId,
		secretAccessKey: SecretAccessKey,
	},
});

// Multer S3 configuration
const upload = multer({
	storage: multerS3({
		s3: awsS3,
		bucket: bucket,
		key: (req, file, cb) => {
			cb(null, Date.now().toString() + '-' + file.originalname);
		},
	}),
	limits: {
		fileSize: 50 * 1024 * 1024, // 50 MB per file ✅
		files: 10, // optional: max 10 files
	},
});

module.exports = { upload };
