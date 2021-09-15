const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const config = require("./config")
const client = new CloudFrontClient({ region: process.env.REGION });

exports.handler = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const object = event.Records[0].s3.object.key;
        const link = config.linking.filter(el => el.bucket === bucket)[0];

        console.log("object", object);
        console.log("link", link);

        if (!object.includes("index.html") || !link) {
            console.log("Not create invalidation because not applicable.", object);
            return { status: 200, result: "Not create invalidation because not applicable." }
        }

        const input = {
            DistributionId: link.distributionId,
            InvalidationBatch: {
                CallerReference: String(Date.now()),
                Paths: {
                    Items: ["/*"],
                    Quantity: 1
                }
            }
        }
        const command = new CreateInvalidationCommand(input);
        const response = await client.send(command);

        console.log("status", response.$metadata.httpStatusCode);
        console.log("invalidation status", response.Invalidation.Status);

        return { status: response.$metadata.httpStatusCode, result: "ok", response }
    } catch (error) {
        return errorHandler(error);
    }
}

const errorHandler = (error) => {
    const obj = {};
    obj["status"] = 500;
    obj["message"] = error.message;
    obj["stack"] = error.stack;
    obj["result"] = "ng";
    if (error.$metadata) {
        obj["status"] = error.$metadata.httpStatusCode;
    }

    console.log("errorHandler", obj);
    return obj;
}