const crypto = require("node:crypto");

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT"
};

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

function sign(payload, secret) {
  const encodedHeader = encodeBase64Url(JSON.stringify(JWT_HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(data, secret).toString("base64url");

  return `${data}.${signature}`;
}

function verify(token, secret) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(decodeBase64Url(encodedHeader));

  if (header.alg !== JWT_HEADER.alg || header.typ !== JWT_HEADER.typ) {
    throw new Error("Unsupported token header");
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createSignature(data, secret);
  const signature = Buffer.from(encodedSignature, "base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(signature, expectedSignature)
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.nbf && now < payload.nbf) {
    throw new Error("Token not active");
  }

  if (payload.exp && now >= payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}

module.exports = {
  sign,
  verify
};
