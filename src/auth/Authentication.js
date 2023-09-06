import jwt from "jsonwebtoken";

export function authenticateMinecraftServer(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey == null || apiKey !== process.env.MC_SERVER_API_KEY) {
        return res.sendStatus(401);  // Unauthorized
    }
    next();
}

export function authenticateMinecraftWs(ws, req, handler) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.MC_SERVER_API_KEY) {
        ws.close();  // Close the connection if authentication fails
    } else {
        handler(ws, req);  // Pass the connection to the handler if authentication succeeds
    }
}

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).send({error: "Access token required"});

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send({error: "Invalid access token"});
        req.user = user.user;
        next();
    });
}

export function authenticateTokenButNotRequired(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Authenticating token")
    console.log(token)

    if (!token) {
        next();
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            next();
            return;
        }
        console.log("User set")
        req.user = user.user;
        next();
    });
}

export function requireSPSEmail(req, res, next) {
    if (req.user.email.indexOf('@sps.edu') !== -1) {
        req.spsEmail = true;
        next();
    } else {
        return res.status(401).send({error: 'You need to have an @sps.edu email to manage clubs.'});
    }
}

export function generateToken(user) {
    const token = jwt.sign({ user: user, isVerifyingUser: false, isVerifyingEmail: false }, process.env.JWT_SECRET);
    return {
        accessToken: token,
        user: user
    };
}

export function generateVerificationLink(user, forEmail){
    const token = jwt.sign({ user: user, isVerifyingEmail: forEmail, isVerifyingUsername: !forEmail }, process.env.JWT_SECRET);
    // return `https://api.henhen1227.com/auth/verify?token=${token}`
    return `http://10.31.64.43:4001/auth/verify?token=${token}`
}