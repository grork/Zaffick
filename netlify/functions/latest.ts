import * as nfunc from "@netlify/functions";

async function handler(): Promise<nfunc.HandlerResponse>  {
    const body = {
      message: process.env.CV_MAGIC_VALUE  
    };
    
    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };