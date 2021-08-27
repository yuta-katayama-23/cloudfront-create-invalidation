const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const config = require("./config")
const client = new CloudFrontClient({ region: process.env.REGION });

exports.handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const objName = event.Records[0].s3.object.key;
    const distriConfig = config.distributions.filter(distribution => distribution.bucket === bucket)[0];

    console.log("objName", objName);
    console.log("distriConfig", distriConfig);

    if (objName.includes("index.html") && distriConfig) {
        const input = {
            DistributionId: distriConfig.distributionId,
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

        return { result: "", response }
    }

    return { result: "Not create invalidation because not applicable." }
}