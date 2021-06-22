const handler = async (event) => {
  console.log(
    `User loading ui (u = "${event.queryStringParameters["u"].substring(0, 36)}", userAgent "${
      event.headers["user-agent"]
    }")`
  );
  return {
    statusCode: 200,
    body: "Hello stranger",
  };
};

module.exports = { handler };
