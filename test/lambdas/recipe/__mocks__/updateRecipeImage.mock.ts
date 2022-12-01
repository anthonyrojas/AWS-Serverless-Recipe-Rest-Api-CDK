import {
    S3Event,
    S3EventRecord,
    Context
} from 'aws-lambda';

const recipeId1 = "1111-1111-1111-11111";
const recipeId2 = "1111-1111-1111-11112";

//mock record from: https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html
const mockRecordValid: S3EventRecord = {
    eventVersion: "2.0",
    eventSource: "aws:s3",
    awsRegion: "us-west-2",
    eventTime: "1970-01-01T00:00:00.000Z",
    eventName: "ObjectCreated:Put",
    userIdentity: {
        "principalId": "EXAMPLE"
    },
    requestParameters: {
        "sourceIPAddress": "127.0.0.1"
    },
    responseElements: {
        "x-amz-request-id": "EXAMPLE123456789",
        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
    },
    s3: {
        s3SchemaVersion: "1.0",
        configurationId: "testConfigRule",
        bucket: {
            name: "my-s3-bucket",
            ownerIdentity: {
                "principalId": "EXAMPLE"
            },
            arn: "arn:aws:s3:::example-bucket"
        },
        object: {
            key: `${recipeId1}/HappyFace.jpg`,
            size: 1024,
            eTag: "0123456789abcdef0123456789abcdef",
            sequencer: "0A1B2C3D4E5F678901"
        }
    }
};
const mockRecordInvalid: S3EventRecord = {
    eventVersion: "2.0",
    eventSource: "aws:s3",
    awsRegion: "us-west-2",
    eventTime: "1970-01-01T00:00:00.000Z",
    eventName: "ObjectCreated:Put",
    userIdentity: {
        "principalId": "EXAMPLE"
    },
    requestParameters: {
        "sourceIPAddress": "127.0.0.1"
    },
    responseElements: {
        "x-amz-request-id": "EXAMPLE123456789",
        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
    },
    s3: {
        s3SchemaVersion: "1.0",
        configurationId: "testConfigRule",
        bucket: {
            name: "my-s3-bucket",
            ownerIdentity: {
                "principalId": "EXAMPLE"
            },
            arn: "arn:aws:s3:::example-bucket"
        },
        object: {
            key: `HappyFace.jpg`, //not having the recipeId in the key makes this event record invalid for the logic of this api
            size: 1024,
            eTag: "0123456789abcdef0123456789abcdef",
            sequencer: "0A1B2C3D4E5F678901"
        }
    }
}
export const mockRecords: S3EventRecord[] = [
    mockRecordValid,
    {
        ...mockRecordValid,
        s3: {
            ...mockRecordValid.s3,
            object: {
                key: `${recipeId2}/HappyFace.jpg`,
                size: 1024,
                eTag: "0123456789abcdef0123456789abcdef",
                sequencer: "0A1B2C3D4E5F678901"
            }
        }
    }
];
export const mockContext: Context = {
    functionName: "update-recipe-image"
} as any;
export const mockS3EventValid: S3Event = {
    Records: [
        ...mockRecords
    ]
};
export const mockS3EventInvalid: S3Event = {
    Records: [
        mockRecordValid,
        mockRecordInvalid
    ]
};
export const mockS3EventEmptyRecords: S3Event = {
    Records: []
}