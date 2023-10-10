import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
const REGION = process.env.AWS_REGION;
const dynamo = new DynamoDBClient({ region: REGION });
const tableName = process.env.MOVIE_TABLE;
//get table name from MOVIE_TABLE environment variable

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
    console.info('received request for get:', event);
    console.info('received context:', context);
    try {
        const params = {
            TableName: tableName,
        };
        const command = new ScanCommand(params);
        console.info(`params Tablename: ${params.TableName}`);
        console.info(`Region: ${REGION}`);
        respBody = await dynamo.send(command);
        respBody = respBody.Items;
        //If a response contains multiple objects, you must unmarshall each record separately before putting them back together.
        //.map() solves this issue
        respBody = respBody.map((i) => unmarshall(i));
    } catch (err) {
        sCode = err.statusCode;
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
        headers: {
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
            /* Allow from anywhere. Generally, * is extremely risky since it allows 
            any site to access the api*/
            "Access-Control-Allow-Origin": "*",
            //"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH" // Allow only GET request 
            "Access-Control-Allow-Methods": "GET"
        },
        body: respBody
    };
    return response;
};
