const jwt = require("jsonwebtoken");
module.exports = (request, response, next) => {
  try {
    //   console.log("auth",req.headers.Authorization)
    //     const token = req.headers.Authorization.split(" ")[1];
    //     const decodedtoken = jwt.verify(token, `${process.env.Token_password}`);
    //     console.log("decoooo",decodedtoken);
    //     req.userdata = { id: decodedtoken.id, email: decodedtoken.email,country:decodedtoken.country}
    //     next();
    console.log("auth", request.headers.authorization);
    const token = request.headers.authorization.split(" ")[1];
    const decodedtoken = jwt.verify(token, `${process.env.Token_password}`);
    console.log("decooo===>>", decodedtoken);
    request.userdata = {
      id: decodedtoken.id,
      name: decodedtoken.name,
      email: decodedtoken.email,
      country: decodedtoken.country,
    };
    next();
  } catch (error) {
    response.status(400).json({
      message: "auth failed",
    });
  }
};
