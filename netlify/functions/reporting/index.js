const handler = async (event) => {
  console.log(`User loading ui (ip = "${event.headers["client-ip"]}", userAgent "${event.headers["user-agent"]}")`);
  return {
    statusCode: 200,
    body: "Hello stranger",
  };
};

module.exports = { handler };
