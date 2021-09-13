const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const config = require("./config")
const client = new CloudFrontClient({ region: process.env.REGION });

exports.handler = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const objName = event.Records[0].s3.object.key;
        const link = config.linking.filter(el => el.bucket === bucket)[0];

        console.log("objName", objName);
        console.log("distriConfig", link);

        if (objName.includes("index.html") && link) {
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
        }

        return { status: 200, result: "Not create invalidation because not applicable." }
    } catch (error) {
        errorHandler(error);
    }
}

const errorHandler = (error) => {
    const obj = {};
    obj["status"] = 500;
    if (error.response) {
        obj["status"] = error.response.status;
        obj["statusText"] = error.response.statusText;
        obj["data"] = error.response.data;
    }
    obj["message"] = error.message;
    obj["result"] = "ng";

    console.log("errorHandler", obj);
    return obj;
}