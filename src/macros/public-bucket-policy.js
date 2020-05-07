module.exports = function publicBucketPolicy (arc, cfn) {

  cfn.Resources.PublicPolicy = {
    Type : 'AWS::S3::BucketPolicy',
    Properties: {
      Bucket: { Ref: 'CacheBucket' },
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'QuitePublic',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 's3:ListBucket',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:aws:s3:::',
                  { Ref: 'CacheBucket' }
                ]
              ]
            }
          }
        ]
      }
    }
  }

  return cfn
}
