import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
const REGION = process.env.AWS_REGION;
const dynamo = new DynamoDBClient({ region: REGION });
//get table name from MOVIE_TABLE environment variable
const tableName = process.env.MOVIE_TABLE;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

//test with command: sam local start-api --port 8080 --log-file logfile.txt
export const lambdaHandler = async (event, context) => {
    let respBody;
    let sCode = 200;
    if (event.httpMethod !== 'GET') {
        throw new Error(`GET method only accepts GET method, you tried: ${event.httpMethod}`);
    }
    //All log statements are written to CloudWatch
    console.info('received request get by key schema:', event);
    const regex2 = (/(%20|\+)/g);
    try {
        const params = {
            TableName: tableName,
            Key: {
                year: { N: event.pathParameters.year },
                title: { S: event.pathParameters.title.replace(regex2, ' ') },
            },
        };
        const command = new GetItemCommand(params);
        console.info(`Tablename: ${tableName}`);
        console.info(`Region: ${REGION}`);
        console.info('Params: ', JSON.stringify(params.Key));
        respBody = await dynamo.send(command);
        respBody = unmarshall(respBody.Item);
    } catch (err) {
        sCode = 400
        console.info('Error info: ', JSON.stringify(err));
        respBody = err.message;
        var stack = err.stack;
        //const { requestId, cfId, extendedRequestId } = err.$$metadata;
        console.info('Error stacktrace: \n');
        console.info(stack);
        //console.info('Error metdata: \n');
        //console.log({ requestId, cfId, extendedRequestId });
    } finally {
        respBody = JSON.stringify(respBody);
        console.info(`About to return status: ${sCode}, respBody: ${respBody}`);
    }
    const response = {
        statusCode: sCode,
        body: respBody
    };
    return response;
};
